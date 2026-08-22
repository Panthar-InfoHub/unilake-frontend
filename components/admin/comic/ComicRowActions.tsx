import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit, Globe, EyeOff, FileArchive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ComicStatus } from "@/app/types/comic";
import { useUpdateComicStatus } from "@/hooks/useComics";
import { toast } from "sonner";

interface ComicRowActionsProps {
  comicId: string;
  status: ComicStatus;
  orderSessionsCount: number;
  onDeleteClick: () => void;
}

export function ComicRowActions({ comicId, status, orderSessionsCount, onDeleteClick }: ComicRowActionsProps) {
  const router = useRouter();
  const { mutateAsync: updateStatus } = useUpdateComicStatus();

  const handleStatusChange = async (newStatus: ComicStatus) => {
    try {
      await updateStatus({ id: comicId, status: newStatus });
      toast.success(`Comic status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update comic status");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-8 w-8 p-0 rounded-lg hover:bg-neutral-100 flex items-center justify-center outline-none">
        <MoreHorizontal className="h-4 w-4 text-neutral-600" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 bg-white border border-neutral-100 shadow-xl">
        <DropdownMenuItem 
          onClick={() => router.push(`/admin/comics/${comicId}`)}
          className="rounded-lg cursor-pointer font-medium p-2.5"
        >
          <Edit className="w-4 h-4 mr-2 text-neutral-500" />
          View / Edit Details
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-neutral-100 my-1" />

        {(status === ComicStatus.DRAFT || status === ComicStatus.UNPUBLISHED) && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange(ComicStatus.PUBLISHED)}
            className="rounded-lg cursor-pointer font-medium p-2.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Globe className="w-4 h-4 mr-2" />
            Publish Comic
          </DropdownMenuItem>
        )}

        {status === ComicStatus.PUBLISHED && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange(ComicStatus.UNPUBLISHED)}
            className="rounded-lg cursor-pointer font-medium p-2.5 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Unpublish
          </DropdownMenuItem>
        )}

        {status === ComicStatus.UNPUBLISHED && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange(ComicStatus.DRAFT)}
            className="rounded-lg cursor-pointer font-medium p-2.5 text-neutral-600 hover:bg-neutral-100"
          >
            <FileArchive className="w-4 h-4 mr-2" />
            Revert to Draft
          </DropdownMenuItem>
        )}

        {status !== ComicStatus.PUBLISHED && (
          <>
            <DropdownMenuSeparator className="bg-neutral-100 my-1" />
            <DropdownMenuItem 
              onClick={onDeleteClick}
              disabled={orderSessionsCount > 0}
              className="rounded-lg cursor-pointer font-medium p-2.5 text-red-600 focus:bg-red-50 focus:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Permanently
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
