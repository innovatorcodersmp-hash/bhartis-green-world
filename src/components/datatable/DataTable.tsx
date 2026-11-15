/**
 * @author Saniya Patil
 * @project Bharti's Green World ERP (Kolhapur)
 * @file src/components/datatable/DataTable.tsx
 * 
 * ----------------------------------------------------------------------------
 * ARCHITECTURAL EXPLANATION & ENGINEERING METADATA:
 * ----------------------------------------------------------------------------
 * 
 * 1. WHAT WAS DONE:
 *    - Built the reusable generic `<DataTable>` component powered by `@tanstack/react-table` (v8).
 *    - Implemented global text search filtering, multi-column sorting (asc/desc), and pagination.
 *    - Integrated mobile horizontal touch-scrolling container with visual swipe helper banner.
 *    - Built empty-state feedback, record counter, and accessible 44px pagination touch triggers.
 * 
 * 2. WHY IT WAS DONE:
 *    - Fulfills Specification 03 Section 2.3: Responsive TanStack Data Table Wrapper.
 *    - Essential for tabular nursery inventory, sales receipts, customer ledgers, and muster rolls.
 *    - Guarantees seamless responsiveness on 360px mobile viewports without breaking column legibility.
 * 
 * 3. WHAT WAS USED:
 *    - `@tanstack/react-table` (v8) core APIs (`useReactTable`, `flexRender`, models).
 *    - Shared UI primitive `<Input>` for instant search filtering.
 *    - Lucide React icons (`Search`, `ArrowUpDown`, `ArrowUp`, `ArrowDown`, `ChevronLeft`, `ChevronRight`, `Inbox`).
 *    - SCSS Modules mapped to design tokens (`DataTable.module.scss`).
 * 
 * 4. HOW IT WORKS:
 *    - Consumes generic `columns` and `data` arrays.
 *    - Calculates column sort toggles and search filtering in real time.
 *    - Renders an overflow container allowing horizontal finger swipe on mobile screens.
 * 
 * ----------------------------------------------------------------------------
 */

'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { Input } from '@/components/ui';
import styles from './DataTable.module.scss';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  toolbarActions?: React.ReactNode;
  initialPageSize?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  emptyMessage = 'No records found.',
  toolbarActions,
  initialPageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  });

  return (
    <div className={styles.tableCard}>
      {/* Top Search Toolbar & External Action Buttons */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            prefixIcon={<Search size={18} />}
            aria-label="Search records"
          />
        </div>
        {toolbarActions && <div>{toolbarActions}</div>}
      </div>

      {/* Visual Swipe Helper Subtext for Touch Devices */}
      <div className={styles.swipeHelper}>
        <span>👈 Swipe horizontally to view full table details 👉</span>
      </div>

      {/* Smooth Horizontal Touch Scroll Container */}
      <div className={styles.scrollContainer}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={`${styles.th} ${canSort ? styles.sortable : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={styles.headerContent}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && (
                          <span aria-hidden="true">
                            {isSorted === 'asc' ? (
                              <ArrowUp size={14} />
                            ) : isSorted === 'desc' ? (
                              <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} opacity={0.4} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className={styles.tbody}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={styles.td}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className={styles.td}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <Inbox size={26} strokeWidth={1.8} />
                    </div>
                    <p className={styles.emptyTitle}>{emptyMessage}</p>
                    <p style={{ fontSize: '0.875rem' }}>
                      Try adjusting your search terms or add a new record.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <div className={styles.pageInfo}>
          <span>
            Showing{' '}
            <strong>
              {table.getRowModel().rows.length > 0
                ? table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                  1
                : 0}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </strong>{' '}
            of <strong>{table.getFilteredRowModel().rows.length}</strong> records
          </span>

          <label style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Rows:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className={styles.pageSizeSelect}
              aria-label="Rows per page"
            >
              {[10, 20, 30, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.paginationControls}>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={styles.pageBtn}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <span style={{ fontSize: '0.875rem', fontWeight: 600, padding: '0 0.5rem' }}>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount() || 1}
          </span>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={styles.pageBtn}
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
