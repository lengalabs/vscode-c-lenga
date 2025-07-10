import { useCallback, useEffect, useRef, useState } from "react";

export function FunctionNode({ data }: { data: { text: string } }) {
  const [value, setValue] = useState(data.text || "");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const onChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(evt.target.value);
  }, []);

  useEffect(() => {
    const mirror = mirrorRef.current;
    const textarea = textAreaRef.current;
    if (mirror && textarea) {
      mirror.textContent = value + "\n";
      const width = mirror.offsetWidth;
      const height = mirror.offsetHeight;

      textarea.style.width = `${width}px`;
      textarea.style.height = `${height}px`;
    }
  }, [value]);

  useEffect(() => {
    setValue(data.text || "");
  }, [data.text]);

  return (
    <div className="function-node">
      <textarea
        ref={textAreaRef}
        value={value}
        onChange={onChange}
        className="editable-textarea nodrag"
        rows={1}
        wrap="off"
      />
      <div
        ref={mirrorRef}
        className="textarea-mirror"
        aria-hidden="true"
      />
    </div>
  );
}
