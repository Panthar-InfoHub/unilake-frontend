"use client";

import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Text, Group } from "react-konva";
import useImage from "use-image";
import { LocalBubble } from "./BubbleSidebar";
import { SAMPLE_PRONOUNS, substituteTokens } from "@/lib/dialogueTokens";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
  clampRect,
  fontSizeToPx,
  normalizedToPixel,
  pixelToNormalized,
} from "./bubbleCoordinates";

interface BubbleMapperCanvasProps {
  artworkUrl: string | null;
  bubbles: LocalBubble[];
  selectedBubbleId: string | null;
  /**
   * Sample child name substituted into `{name}` for the on-canvas preview, so
   * the admin sizes bubbles against a realistic name instead of the literal
   * token. Comes from the page's Short/Long toggle — the same one driving the
   * sidebar preview.
   */
  previewName: string;
  onSelectBubble: (id: string | null) => void;
  onUpdateBubble: (id: string, updates: Partial<LocalBubble>) => void;
}

export function BubbleMapperCanvas({
  artworkUrl,
  bubbles,
  selectedBubbleId,
  previewName,
  onSelectBubble,
  onUpdateBubble,
}: BubbleMapperCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const [image] = useImage(artworkUrl || "");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1, imageWidth: 0, imageHeight: 0 });

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && image) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        
        // Calculate scale to fit image within container
        const imgRatio = image.width / image.height;
        const containerRatio = containerW / containerH;
        
        let targetW, targetH;
        
        if (imgRatio > containerRatio) {
          targetW = containerW - 40; // 20px padding
          targetH = targetW / imgRatio;
        } else {
          targetH = containerH - 40;
          targetW = targetH * imgRatio;
        }

        setDimensions({
          width: containerW,
          height: containerH,
          scale: targetW / image.width,
          imageWidth: targetW,
          imageHeight: targetH
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [image]);

  // Handle Transformer Selection
  useEffect(() => {
    if (selectedBubbleId && trRef.current) {
      const node = stageRef.current.findOne(`#bubble-${selectedBubbleId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedBubbleId, bubbles]);

  const checkDeselect = (e: any) => {
    // deselect when clicked on empty area or image
    const clickedOnEmpty = e.target === e.target.getStage();
    const clickedOnImage = e.target.name() === 'backgroundImage';
    if (clickedOnEmpty || clickedOnImage) {
      onSelectBubble(null);
    }
  };

  if (!artworkUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-100 rounded-3xl border border-neutral-200 m-4 shadow-inner">
        <p className="text-neutral-500 font-medium">No artwork uploaded for this page.</p>
      </div>
    );
  }

  // Calculate centered position
  const offsetX = (dimensions.width - dimensions.imageWidth) / 2;
  const offsetY = (dimensions.height - dimensions.imageHeight) / 2;

  const activeBubbles = bubbles.filter(b => !b.isDeleted);

  return (
    <div className="flex-1 relative bg-neutral-100 rounded-3xl overflow-hidden shadow-inner m-4 border border-neutral-200" ref={containerRef}>
      {dimensions.width > 0 && image && (
        <Stage 
          width={dimensions.width} 
          height={dimensions.height}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
          ref={stageRef}
        >
          <Layer>
            {/* Centered Image */}
            <Group x={offsetX} y={offsetY}>
              <KonvaImage 
                image={image} 
                width={dimensions.imageWidth} 
                height={dimensions.imageHeight} 
                name="backgroundImage"
              />

              {/* Bubbles */}
              {activeBubbles.map((bubble) => {
                // Convert normalized values to pixel values based on current image render size
                const x = normalizedToPixel(bubble.x || 0.1, 0, image.width, dimensions.imageWidth);
                const y = normalizedToPixel(bubble.y || 0.1, 0, image.height, dimensions.imageHeight);
                const width = normalizedToPixel(bubble.width || 0.2, 0, image.width, dimensions.imageWidth);
                const height = normalizedToPixel(bubble.height || 0.1, 0, image.height, dimensions.imageHeight);

                return (
                  <Group
                    key={bubble.id}
                    id={`bubble-${bubble.id}`}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    draggable
                    dragBoundFunc={(pos) => {
                      // pos is in absolute stage coordinates; bubbles live inside
                      // the centring Group at (offsetX, offsetY).
                      // Assumes an unscaled Stage — revisit if zoom is added.
                      const maxX = offsetX + dimensions.imageWidth - width;
                      const maxY = offsetY + dimensions.imageHeight - height;

                      return {
                        x: Math.min(Math.max(pos.x, offsetX), maxX),
                        y: Math.min(Math.max(pos.y, offsetY), maxY),
                      };
                    }}
                    onClick={() => onSelectBubble(bubble.id)}
                    onTap={() => onSelectBubble(bubble.id)}
                    onDragEnd={(e) => {
                      const clamped = clampRect({
                        x: pixelToNormalized(e.target.x(), 0, image.width, dimensions.imageWidth),
                        y: pixelToNormalized(e.target.y(), 0, image.height, dimensions.imageHeight),
                        width: bubble.width ?? 0.2,
                        height: bubble.height ?? 0.1,
                      });

                      // Snap the node to the clamped position explicitly. If the
                      // clamped value equals the previous one, React sees no prop
                      // change and Konva would leave the node where it was
                      // dropped — visually outside the artwork.
                      e.target.x(normalizedToPixel(clamped.x, 0, image.width, dimensions.imageWidth));
                      e.target.y(normalizedToPixel(clamped.y, 0, image.height, dimensions.imageHeight));

                      onUpdateBubble(bubble.id, { x: clamped.x, y: clamped.y });
                    }}
                    onTransformEnd={(e) => {
                      // transformer is changing scale of the node
                      // and NOT its width or height
                      // but in the store we have only width and height
                      // to match the data better we will reset scale on transform end
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();

                      node.scaleX(1);
                      node.scaleY(1);

                      const clamped = clampRect({
                        x: pixelToNormalized(node.x(), 0, image.width, dimensions.imageWidth),
                        y: pixelToNormalized(node.y(), 0, image.height, dimensions.imageHeight),
                        width: pixelToNormalized(node.width() * scaleX, 0, image.width, dimensions.imageWidth),
                        height: pixelToNormalized(node.height() * scaleY, 0, image.height, dimensions.imageHeight),
                      });

                      node.x(normalizedToPixel(clamped.x, 0, image.width, dimensions.imageWidth));
                      node.y(normalizedToPixel(clamped.y, 0, image.height, dimensions.imageHeight));

                      onUpdateBubble(bubble.id, {
                        x: clamped.x,
                        y: clamped.y,
                        width: clamped.width,
                        height: clamped.height,
                      });
                    }}
                  >
                    <Rect
                      width={width}
                      height={height}
                      fill={selectedBubbleId === bubble.id ? "rgba(145, 74, 140, 0.2)" : "rgba(255, 255, 255, 0.4)"}
                      stroke={selectedBubbleId === bubble.id ? "#914A8C" : "#999"}
                      strokeWidth={2}
                      cornerRadius={8}
                    />
                    <Text
                      // Show what the reader will see, not the raw token —
                      // "{name}" gives no sense of how much room the text needs.
                      // Note this is still Konva's own layout, not the print
                      // renderer's: the backend wraps on real glyph widths and
                      // shrinks the type to fit, so treat this as a guide to
                      // placement rather than an exact proof of the final page.
                      text={
                        bubble.dialogue?.trim()
                          ? substituteTokens(bubble.dialogue, previewName, SAMPLE_PRONOUNS)
                          : "Double click to edit..."
                      }
                      width={width - 10}
                      height={height - 10}
                      x={5}
                      y={5}
                      fontSize={fontSizeToPx(
                        bubble.fontSize ?? DEFAULT_FONT_SIZE,
                        dimensions.imageHeight
                      )}
                      fill={bubble.fontColor ?? DEFAULT_FONT_COLOR}
                      align="center"
                      verticalAlign="middle"
                      wrap="word"
                    />
                  </Group>
                );
              })}
            </Group>

            <Transformer 
              ref={trRef}
              // No backend field for rotation — see note in app/types/comic.ts
              rotateEnabled={false}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum size
                if (newBox.width < 20 || newBox.height < 20) {
                  return oldBox;
                }
                // Reject any resize that would push the box outside the artwork.
                // Boxes are in the same absolute space as offsetX/offsetY.
                if (
                  newBox.x < offsetX ||
                  newBox.y < offsetY ||
                  newBox.x + newBox.width > offsetX + dimensions.imageWidth ||
                  newBox.y + newBox.height > offsetY + dimensions.imageHeight
                ) {
                  return oldBox;
                }
                return newBox;
              }}
              borderStroke="#914A8C"
              anchorStroke="#914A8C"
              anchorFill="#fff"
              anchorSize={8}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
