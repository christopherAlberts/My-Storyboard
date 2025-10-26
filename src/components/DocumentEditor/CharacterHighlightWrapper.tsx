import React from 'react';
import ReactQuill from 'react-quill';

interface CharacterHighlightWrapperProps {
  content: string;
  onChange: (content: string) => void;
  modules: any;
  formats: any;
}

const CharacterHighlightWrapper: React.FC<CharacterHighlightWrapperProps> = ({
  content,
  onChange,
  modules,
  formats
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="flex-1"
      />
    </div>
  );
};

export default CharacterHighlightWrapper;
