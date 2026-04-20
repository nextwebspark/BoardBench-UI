"use client";

import { useState, useMemo } from "react";
import { useNavigation } from "@/lib/navigation/context";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { formatDate, cn } from "@/lib/utils";
import type { Project } from "@/types/database.types";
import { FolderKanban, ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface ProjectsTableProps {
  data: Project[];
  isLoading?: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectsTable({ data, isLoading, onEdit, onDelete }: ProjectsTableProps) {
  const { navigateTo } = useNavigation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Project>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Project <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "region",
        header: "Region",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.region ?? "—"}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                )}
                aria-label="Project actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search projects…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-xs h-8 text-sm"
      />

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs text-muted-foreground font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigateTo(`/dashboard/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {table.getFilteredRowModel().rows.length} project
        {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
