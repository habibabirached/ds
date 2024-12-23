import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, Typography } from "@mui/material";

const CustomRowRenderer = (props) => {
  const { row, columns, expandedRows } = props;
  return (
    <>
      <div className="MuiDataGrid-row" data-id={row.id}>
        {columns.map((column) => (
          <div
            key={column.field}
            className="MuiDataGrid-cell"
            style={{
              flex: column.flex,
              minWidth: column.width,
              maxWidth: column.width,
            }}
          >
            {column.renderCell ? column.renderCell({ row }) : row[column.field]}
          </div>
        ))}
      </div>
      {expandedRows[row.id] && (
        <Box key={row.id} mt={2} p={2} border={1}>
          <Typography>This is the expanded content for {row.name}</Typography>
        </Box>
      )}
    </>
  );
};

const ExampleComponent = () => {
  const [expandedRows, setExpandedRows] = useState({});

  const handleToggleExpand = (rowId) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [rowId]: !prevExpandedRows[rowId],
    }));
  };

  const rows = [
    { id: 1, name: "Row 1" },
    { id: 2, name: "Row 2" },
    { id: 3, name: "Row 3" },
  ];

  const columns = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "name", headerName: "Name", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Button
          variant="contained"
          onClick={() => handleToggleExpand(params.row.id)}
        >
          {expandedRows[params.row.id] ? "Collapse" : "Expand"}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        getRowHeight={() => "auto"}
        getRowClassName={(params) => `row-${params.row.id}`}
        components={{
          Row: (props) => (
            <CustomRowRenderer
              {...props}
              columns={columns}
              expandedRows={expandedRows}
            />
          ),
        }}
      />
    </div>
  );
};

export default ExampleComponent;
