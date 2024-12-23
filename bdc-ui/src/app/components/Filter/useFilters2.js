import { useState, useEffect, useCallback } from "react";

const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

// Array of day and month names for formatting
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Function to format the date as "Day, DD Mon YYYY" in local time
function formatLocalDate(date) {
  const day = days[date.getDay()];
  const dateNum = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}, ${dateNum < 10 ? "0" + dateNum : dateNum} ${month} ${year}`;
}
let timeout;
const debounce = (func, wait) => {
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

const useFilters = (initialFilters, storageKey) => {
  // state variables.
  const [timer, setTimer] = useState(0);
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem(storageKey);
    const parsedFilters = savedFilters ? JSON.parse(savedFilters) : null;
    return parsedFilters && !isEmptyObject(parsedFilters)
      ? parsedFilters
      : initialFilters;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(filters));
  }, [filters, storageKey]);

  // Update filters helper function
  const updateFilters = (field, name, value) => {
    console.log("user typed:", value);
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: { ...prevFilters[field], [name]: value },
    }));
  };

  // Event handler for filter change
  const handleEventChange = (field, event) => {
    const { name, value } = event.target;
    updateFilters(field, name, value);
    setTimer(800);
  };

  // Function to create a filter change handler for a specific field
  const handleFilterChange = (field) => {
    return handleEventChange.bind(null, field);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const filterRows = (rows, filters) => {
    // console.log("rowsss = ", rows);
    return rows.filter((row) => {
      return Object.keys(filters).every((field) => {
        //console.log("filtersss = ", filters);
        const filter = filters[field];
        let rowValue = row[field];
        let filterValue;
        try {
          filterValue = filter.value.trim().toLowerCase();
        } catch (error) {
          filterValue = null;
        }

        if (filter.type === "is not empty") { 
          return rowValue !== null && rowValue !== undefined && rowValue !== ""; 
        }

        if (filter.type === "is empty") { 
          return rowValue === null || rowValue === undefined || rowValue === ""; 
      }

        // Debugging output to check the values being compared
        // console.log(`refz_toi2 Filtering field: ${field}`);
        // console.log(
        //   `refz_toi2 Row value: ${rowValue}, Filter value: ${filterValue}`
        // );
        if (!filterValue) return true; // Skip empty filters

        if (field === "is_manual") {
          if (filterValue === "manual") return rowValue === true;
          if (filterValue === "ai") return rowValue === false;
          return true;
        }

        // Check if the rowValue and filterValue are dates
        let isDateComparison = field.includes("date");
        if (field.includes("validated_by")) isDateComparison = false;
        // console.log("refz_date = ", field);

        // if (filterValue == 1000) {
        //   console.log(
        //     "rowValue, numericFilterValue = ",
        //     rowValue,
        //     rowValue + 10.11
        //   );
        // }

        const isNumericComparison =
          !isNaN(rowValue) &&
          !isNaN(filterValue) &&
          (field.includes("distance") ||
            field.includes("area") ||
            field.includes("width") ||
            field.includes("length"));

        if (field.includes("area")) rowValue = rowValue * 1000 * 1000;
        if (field.includes("width")) rowValue = rowValue * 1000;
        if (field.includes("length")) rowValue = rowValue * 1000;

        if (filterValue == 1000) {
          console.log(
            "rowValueeee, numericFilterValue = ",
            rowValue,
            rowValue + 10.11,
            isNumericComparison,
            !isNaN(rowValue),
            !isNaN(filterValue),
            field
          );
        }
        // console.log(
        //   "refz_contains before switch   before any if: filter.type = ",
        //   filter.type,
        //   isDateComparison
        // );

        // if it is a date
        if (isDateComparison) {
          const dateRowValue = new Date(rowValue); // this is in GMT
          const dateFilterValue = new Date(filterValue);
          const stringRowValue = formatLocalDate(dateRowValue)
            .toLowerCase()
            .trim();

          // console.log("refz_date_in_Local = ", stringRowValue);
          // console.log("refz_date_in_GMT_afterNew = ", dateRowValue);

          const stringFilterValue = filterValue.toString().toLowerCase().trim();

          switch (filter.type) {
            case "during":
              return dateRowValue.getTime() === dateFilterValue.getTime();
            case "before":
              return dateRowValue.getTime() < dateFilterValue.getTime();
            case "after":
              return dateRowValue.getTime() > dateFilterValue.getTime();
            case "is empty":
              return stringRowValue === "";
            case "contains":
              // console.log(
              //   "refz_containss : ",
              //   stringRowValue,
              //   stringFilterValue
              // );
              return stringRowValue.includes(stringFilterValue);
              case "not contains":
                return !stringRowValue.includes(stringFilterValue);              
            default:
              // console.log(
              // "refz_92938382 default upper , filterValue = ",
              //   filterValue,
              //   rowValue
              // );
              return true;
          }
        } else if (isNumericComparison) {
          // Numeric comparison
          const numericRowValue = parseFloat(rowValue);
          const numericFilterValue = parseFloat(filterValue);
          console.log("numericRowValue ========> ", numericRowValue);

          switch (filter.type) {
            case "equals":
              return numericRowValue === numericFilterValue;
            case "less than":
              // console.log(
              //   "numericRowValue = ",
              //   numericRowValue,
              //   "numericFilterValue = ",
              //   numericFilterValue,
              //   numericRowValue < numericFilterValue
              // );
              return numericRowValue < numericFilterValue;
            case "less than or equal to":
              return numericRowValue <= numericFilterValue;
            case "greater than":
              return numericRowValue > numericFilterValue;
            case "greater than or equal to":
              return numericRowValue >= numericFilterValue;
            default:
              // console.log("refz_92938382 default middle");
              return true;
          }
        } else {
          // Handle non-numeric and non-date comparisons
          // console.log("refz_I_am_here");
          const stringRowValue =
            rowValue?.toString().toLowerCase().trim() || "";
          const stringFilterValue = filterValue.toString().toLowerCase().trim();
          //console.log("numericFilterValue ====== ");

          switch (filter.type) {
            case "contains":
              // console.log(
              //   "refz_92938382 stringRowValue = ",
              //   stringRowValue,
              //   stringRowValue.includes(stringFilterValue),
              //   stringFilterValue
              // );
              // console.log(
              //   "refz_92938382  stringFilterValue = ",
              //   stringFilterValue
              // );
              return stringRowValue.includes(stringFilterValue);
            case "not contains":
              return !stringRowValue.includes(stringFilterValue);              
            case "equals":
              return stringRowValue === stringFilterValue;
            case "starts with":
              return stringRowValue.startsWith(stringFilterValue);
            case "ends with":
              return stringRowValue.endsWith(stringFilterValue);
            case "is empty":
              return stringRowValue === "";
            case "is not empty":
              return stringRowValue !== "";
            case "is any of":
              return stringFilterValue
                .split(",")
                .some((val) => stringRowValue === val.trim());
            default:
              // console.log("refz_92938382 default bottom");
              return true;
          }
        }
      });
    });
  };

  const applyFilters = (rows, filters) => {
    clearTimeout(timeout);
    console.log("timer = ", timer);
    timeout = setTimeout(() => {
      setTimer(0);
    }, timer);
    if (timer == 0) return filterRows(rows, filters);
    return [];
  };

  return [filters, handleFilterChange, clearFilters, setFilters, applyFilters];
};

export default useFilters;
