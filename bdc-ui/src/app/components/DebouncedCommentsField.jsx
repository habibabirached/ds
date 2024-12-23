import React, { useCallback, useEffect } from 'react';
import { TextField } from '@mui/material';
import { debounce } from 'lodash';

const DebouncedCommentsField = ({
  imageComments, 
  setImageComments,
  label,
  placeholder
}) => {
  const [localValue, setLocalValue] = React.useState(imageComments);

  useEffect(() => {
    setLocalValue(imageComments);
  }, [imageComments]);

  const debouncedUpdate = useCallback(
    debounce((value) => {
      setImageComments(value);
    }, 1500),
    [setImageComments]
  );

  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedUpdate(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="mt-4">
      <TextField
        id="review-comments"
        label={label}
        multiline
        rows={3}
        fullWidth
        variant="outlined"
        value={localValue}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        InputLabelProps={{
          shrink: true
        }}
      />
    </div>
  );
};

export default DebouncedCommentsField;