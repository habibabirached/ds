import React from "react";
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  Select,
  IconButton,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert"; // Double arrow icon

const textFieldStyles = {
  margin: 0,
  padding: 0,
  "& .MuiInputBase-root": {
    height: "40px",
    fontSize: "0.875rem",
  },
  "& .MuiOutlinedInput-input": {
    padding: "8px 14px",
  },
};

const CustomColumnHeader = ({
  column,
  filters,
  handleFilterChange,
  apiRef,
  isManualFilter,
}) => {
  const filter = filters[column.field] || {
    value: "",
    type: column.type === "number" ? "is not empty" : "contains",
  };

  let isNumeric = column.type === "number";

  let isDate = column.field.includes("date");

  if (column.field.includes("validated_by")) {
    isNumeric = false;
    isDate = false;
  }

  console.log("column.field = ", column.field, isNumeric, isDate);
  const handleReorder = (event) => {
    event.stopPropagation();
    const sortModel = apiRef.current.getSortModel();
    const isAsc =
      !sortModel.length ||
      sortModel[0].field !== column.field ||
      sortModel[0].sort === "desc";
    apiRef.current.setSortModel([
      { field: column.field, sort: isAsc ? "asc" : "desc" },
    ]);
  };

  const handleTextFieldClick = (event) => {
    event.stopPropagation();
  };

  const handleSelectClick = (event) => {
    event.stopPropagation();
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      sx={{
        height: "100%",
        width: "100%",
        backgroundColor: "rgba(0, 0, 0, 0)",
      }}
    >
      <Typography
        variant="body2"
        align="center"
        style={{ fontWeight: "bold", lineHeight: "1", paddingBottom: "4px" }}
      >
        {column.headerName}
      </Typography>
      <Box display="flex" justifyContent="center" alignItems="center">
        <IconButton size="small" onClick={handleReorder}>
          <SwapVertIcon fontSize="small" />
          <Typography variant="body2" style={{ marginLeft: 4 }}>
            sort
          </Typography>
        </IconButton>
      </Box>

      {isManualFilter ? (
        <Select
          value={filter.value}
          name="value"
          onChange={handleFilterChange(column.field)}
          style={{ marginBottom: 5, width: "100%" }}
          onClick={handleSelectClick}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="manual">Manual</MenuItem>
          <MenuItem value="ai">AI</MenuItem>
        </Select>
      ) : isNumeric ? (
        <Select
          value={filter.type}
          name="type"
          onChange={handleFilterChange(column.field)}
          style={{ marginBottom: 5, width: "100%" }}
          onClick={handleSelectClick}
        >
          <MenuItem value="equals">Equals</MenuItem>
          <MenuItem value="less than">Less than</MenuItem>
          <MenuItem value="less than or equal to">
            Less than or equal to
          </MenuItem>
          <MenuItem value="greater than">Greater than</MenuItem>
          <MenuItem value="greater than or equal to">
            Greater than or equal to
          </MenuItem>
          <MenuItem value="is empty">Is Empty</MenuItem>
          <MenuItem value="is not empty">Is Not Empty</MenuItem>
        </Select>
      ) : isDate ? (
        <Select
          value={filter.type}
          name="type"
          onChange={handleFilterChange(column.field)}
          style={{ marginBottom: 5, width: "100%" }}
          onClick={handleSelectClick}
        >
          <MenuItem value="during">During</MenuItem>
          <MenuItem value="before">Before</MenuItem>
          <MenuItem value="after">After</MenuItem>
          <MenuItem value="contains">Contains</MenuItem>
          <MenuItem value="not contains">Not Contains</MenuItem>          
          <MenuItem value="is empty">Is Empty</MenuItem>
        </Select>
      ) : (
        <Select
          value={filter.type}
          name="type"
          onChange={handleFilterChange(column.field)}
          style={{ marginBottom: 5, width: "100%" }}
          onClick={handleSelectClick}
        >
          <MenuItem value="contains">Contains</MenuItem>
          <MenuItem value="not contains">Not Contains</MenuItem>                  
          <MenuItem value="equals">Equals</MenuItem>
          <MenuItem value="starts with">Starts With</MenuItem>
          <MenuItem value="ends with">Ends With</MenuItem>
          <MenuItem value="is empty">Is Empty</MenuItem>
          <MenuItem value="is not empty">Is Not Empty</MenuItem>
          <MenuItem value="is any of">Is Any Of</MenuItem>
        </Select>
      )}

      <TextField
        style={{
          ...textFieldStyles,
          marginTop: "4px",
          height: "40px",
          width: "100%",
        }}
        variant="outlined"
        placeholder="Filter"
        size="small"
        name="value"
        value={filter.value || ""}
        onChange={handleFilterChange(column.field)}
        onClick={handleTextFieldClick}
        autoComplete="off"
        disabled={filter.type === "is empty" || filter.type === "is not empty"}
      />
    </Box>
  );
};

export default CustomColumnHeader;
