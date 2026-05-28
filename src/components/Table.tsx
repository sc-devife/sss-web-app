import React from "react";

type Column = {
  header: string;
  accessor: string;
  render?: (row: any) => React.ReactNode;
};

type TableProps = {
  columns: Column[];
  data: any[];
};

const Table: React.FC<TableProps> = ({ columns, data }) => {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th
              key={index}
              style={{
                backgroundColor: "#979797",
                textAlign: "left",
                padding: "10px",
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col, j) => (
              <td
                key={j}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #eee",
                  fontSize: "0.9rem",
                }}
              >
                {col.render
                  ? col.render(row)
                  : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;