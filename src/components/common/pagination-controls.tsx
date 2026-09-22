"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  totalItems: number;
  isPending?: boolean;
}

export const PaginationControls = React.memo(function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  isPending: externalIsPending
}: PaginationControlsProps) {
  const [isTransitioning, startLocalTransition] = useTransition();
  const isBusy = externalIsPending || isTransitioning;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    startLocalTransition(() => {
      onPageChange(page);
    });
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    startLocalTransition(() => {
      onItemsPerPageChange(newSize);
      onPageChange(1);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 px-2">
      <div className="text-sm text-muted-foreground w-full text-center sm:text-left sm:w-auto">
        {startItem}-{endItem} sur {totalItems}
      </div>
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 w-full sm:w-auto">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium hidden sm:block">Lignes par page</p>
          <p className="text-sm font-medium sm:hidden">Lignes</p>
          <Select
            value={`${itemsPerPage}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex w-auto sm:w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} / {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1 || isBusy}
            >
              <span className="sr-only">Aller à la première page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isBusy}
            >
              <span className="sr-only">Aller à la page précédente</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isBusy}
            >
              <span className="sr-only">Aller à la page suivante</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages || isBusy}
            >
              <span className="sr-only">Aller à la dernière page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
