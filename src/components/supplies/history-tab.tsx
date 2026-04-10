"use client";

import React, { memo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplyTransactionList } from "@/components/supplies/supply-transaction-list";
import { PaginationControls } from "@/components/common/pagination-controls";

interface HistoryTabProps {
    transactions: any[];
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    isPending: boolean;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (n: number) => void;
}

export const HistoryTab = memo(({
    transactions,
    currentPage,
    totalPages,
    itemsPerPage,
    isPending,
    onPageChange,
    onItemsPerPageChange
}: HistoryTabProps) => {
    return (
        <Card className="border-none shadow-none bg-white p-6 rounded-2xl">
            <CardHeader className="px-0 pt-0 pb-6">
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">Historique des Transactions</CardTitle>
                <CardDescription>Journal complet des entrées et sorties de matériel.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <SupplyTransactionList transactions={transactions} />
            </CardContent>
            {totalPages > 1 && (
                <CardFooter className="px-0 pt-6 border-t border-slate-100">
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={onItemsPerPageChange}
                        totalItems={transactions.length}
                        isPending={isPending}
                    />
                </CardFooter>
            )}
        </Card>
    );
});
