import React from 'react';
import { Folder, File } from 'lucide-react';

const FolderStructure = ({ files }) => {
  const buildFileTree = (files) => {
    const root = {};
    files.forEach(file => {
      const parts = getFilePath(file).split('/');
      let currentLevel = root;
      parts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = index === parts.length - 1 ? { isFile: true } : { isFile: false, children: {} };
        }
        currentLevel = currentLevel[part].children || currentLevel[part];
      });
    });
    return root;
  };

  const getFilePath = (file) => {
    if (file.webkitRelativePath && file.webkitRelativePath !== "") {
      return file.webkitRelativePath;
    } else {
      return file.path.replace(/^\/+/, "");
    }
  };

  const renderFileTree = (node, path = '', depth = 0) => {
    if (!node || (node.isFile && !node.children)) return null;
    return (
      <ul className={depth > 0 ? 'nested' : ''}>
        {Object.entries(node).map(([key, value]) => (
          <li key={path + key}>
            <div className="flex items-center">
              {depth > 0 && <span className="indentation"></span>}
              {value.isFile ? (
                <File size={16} className="icon file-icon" />
              ) : (
                <Folder size={16} className="icon folder-icon" />
              )}
              {key}
            </div>
            {value.children && renderFileTree(value.children, path + key + '/', depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  const fileTree = buildFileTree(files);

  return (
    <div className="folder-structure">
      {renderFileTree(fileTree)}
    </div>
  );
};

export default FolderStructure;