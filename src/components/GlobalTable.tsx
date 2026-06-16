import React, { useMemo, useState } from "react";
import * as S from "./styles/globalTableStyle";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  FaAngleLeft,
  FaAngleRight,
  FaArrowDown,
  FaArrowUp,
} from "react-icons/fa6";

interface GlobalTableProps<T extends object> {
  data: T[];
}

function GlobalTable<T extends object>({ data }: GlobalTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const hiddenColumns = ["uid", "_id"];

  const columns = useMemo<ColumnDef<T>[]>(
    () =>
      data.length
        ? Object.keys(data[0])
            .filter((key) => !hiddenColumns.includes(key))
            .map((key) => ({
              accessorKey: key,
              header: key
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase()),
            }))
        : [],
    [data],
  );

  const table = useReactTable({
    data,
    columns,

    state: {
      globalFilter,
      pagination,
    },

    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  const getPaginationItems = () => {
    const current = pageIndex + 1;
    const items: (number | string)[] = [];

    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) {
        items.push(i);
      }
      return items;
    }

    items.push(1);

    if (current > 3) {
      items.push("...");
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(pageCount - 1, current + 1);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (current < pageCount - 2) {
      items.push("...");
    }

    if (pageCount > 1) {
      items.push(pageCount);
    }

    return items;
  };

  return (
    <>
      <S.SearchWrapper>
        <S.SearchInput
          placeholder="Search data..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </S.SearchWrapper>

      <S.TableWrapper>
        <S.Table>
          <S.TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <S.TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortState = header.column.getIsSorted();

                  return (
                    <S.TableHeader
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <S.HeaderContent>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}

                        <S.SortIcons>
                          <FaArrowUp
                            color={sortState === "asc" ? "#5E81F4" : "#D0D5DD"}
                            size={10}
                          />
                          <FaArrowDown
                            color={sortState === "desc" ? "#5E81F4" : "#D0D5DD"}
                            size={10}
                          />
                        </S.SortIcons>
                      </S.HeaderContent>
                    </S.TableHeader>
                  );
                })}
              </S.TableRow>
            ))}
          </S.TableHead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <S.TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <S.TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </S.TableCell>
                ))}
              </S.TableRow>
            ))}
          </tbody>
        </S.Table>
      </S.TableWrapper>

      <S.PaginationContainer>
        <S.Pagination>
          <S.PageButton
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <FaAngleLeft />
            Previous
          </S.PageButton>

          {getPaginationItems().map((item, index) =>
            item === "..." ? (
              <S.Ellipsis key={`ellipsis-${index}`}>...</S.Ellipsis>
            ) : (
              <S.PageButton
                key={item}
                active={pageIndex + 1 === item}
                onClick={() => table.setPageIndex(Number(item) - 1)}
              >
                {item}
              </S.PageButton>
            ),
          )}

          <S.PageButton
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <FaAngleRight />
          </S.PageButton>
        </S.Pagination>
        <S.PageInfo>
          Page {pageIndex + 1} of {pageCount}
        </S.PageInfo>
      </S.PaginationContainer>
    </>
  );
}

export default GlobalTable;
