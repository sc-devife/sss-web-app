import styled from "@emotion/styled";

export const Container = styled.div`
  width: 100%;
`;

export const SearchWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
`;

export const SearchInput = styled.input`
  width: 340px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  outline: none;
  font-size: 14px;

  &:focus {
    border-color: #aacf25;
  }
`;

export const TableWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef2f7;
`;

export const Table = styled.table`
  border-collapse: collapse;
  min-width: max-content;
    width: 100%;
`;

export const TableHead = styled.thead`
  background: #f8fafc;
`;

export const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SortIcons = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1px;
  line-height: 1;
`;

export const TableRow = styled.tr`
  border-bottom: 1px solid #eef2f7;

  &:hover {
    background: #fafbfc;
  }
`;

export const TableHeader = styled.th`
  padding: 10px 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #475467;
  cursor: pointer;
  white-space: nowrap;
`;

export const TableCell = styled.td`
  padding: 10px 12px;
  font-size: 14px;
  color: #344054;
`;

export const PaginationContainer = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
`;

export const PageInfo = styled.span`
  position: absolute;
  right: 0;
  padding: 0 8px;
  font-size: 14px;
  color: #667085;
`;

export const Pagination = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto; /* Centers pagination */
`;

export const PageButton = styled.button<{ active?: boolean }>`
  min-width: 38px;
  padding: 8px 12px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid ${({ active }) => (active ? "#D6FB4B" : "#d0d5dd")};
  background: ${({ active }) => (active ? "#D6FB4B" : "#ffffff")};
  color: ${({ active }) => (active ? "#000000" : "#344054")};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? "#D6FB4B" : "#f9fafb")};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

export const Ellipsis = styled.span`
  padding: 0 8px;
  color: #667085;
  font-weight: 600;
`;