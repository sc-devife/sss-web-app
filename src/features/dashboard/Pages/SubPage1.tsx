import React from "react";
import Table from "../../../components/Table";
import TableData from "../../../components/TableData.json";
const SubPage1: React.FC = () => {
  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Service", accessor: "service" },
    { header: "Date", accessor: "date" },
    { header: "Gender", accessor: "gender" },

    {
      header: "Client Name",
      accessor: "client-name",
    },
    {
      header: "Phone",
      accessor: "client-number",
    },

    {
      header: "Status",
      accessor: "status",
      render: (row: any) => (
        <span
          style={{
            color:
              row.status === "Completed"
                ? "green"
                : "orange",
            fontWeight: "bold",
          }}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "8px"}}>
      <Table columns={columns} data={TableData} />
    </div>
  );
};

export default SubPage1;