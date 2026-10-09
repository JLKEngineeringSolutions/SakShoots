import { Fragment, type ReactNode } from 'react';

const TOKEN = /(\*[^*]+\*|_[^_]+_)/g;

function renderLine(line: string, key: string): ReactNode[] {
  return line.split(TOKEN).map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${key}-${i}`} className="text-[#e0913f] font-serif italic">{part.slice(1, -1)}</em>;
    }
    if (part.length > 2 && part.startsWith('_') && part.endsWith('_')) {
      return <em key={`${key}-${i}`} className="italic">{part.slice(1, -1)}</em>;
    }
    return <Fragment key={`${key}-${i}`}>{part}</Fragment>;
  });
}

export function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderLine(line, String(i))}
        </Fragment>
      ))}
    </>
  );
}
