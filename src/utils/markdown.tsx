import React from "react";

/**
 * A highly tailored custom Markdown parser for the Fintech chatbot.
 * Accents bold text **bold** and basic list structures safely.
 */
export const renderMarkdownText = (text: string): React.ReactNode[] => {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    let content = line;
    // List pattern bullet
    const isBullet = content.trim().startsWith("*") || content.trim().startsWith("-");
    if (isBullet) {
      content = content.replace(/^(\s*[*|-]\s*)/, "");
    }

    // Bold pattern replace **text** with <strong>text</strong>
    const parts = content.split(/\*\*([^*]+)\*\*/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (pIdx % 2 === 1) {
        return (
          <strong key={pIdx} className="font-bold text-slate-900 border-b border-indigo-100">
            {part}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed my-1">
          {renderedParts}
        </li>
      );
    }

    if (line.startsWith("###")) {
      return (
        <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-indigo-700 mt-4 mb-2">
          {content.slice(3).trim()}
        </h4>
      );
    }

    if (line.trim() === "") {
      return <div key={idx} className="h-2"></div>;
    }

    return (
      <p key={idx} className="text-xs text-slate-700 leading-relaxed my-1">
        {renderedParts}
      </p>
    );
  });
};
