import React from 'react';

// Use Vite's import.meta.glob to import all SVGs in the elements directory
const svgModules = import.meta.glob('../../assets/elements/*.svg', { eager: true, as: 'url' });

const ELEMENTS = Object.values(svgModules) as string[];

interface ElementsPanelProps {
  onAddElement: (svgPath: string) => void;
}

const ElementsPanel: React.FC<ElementsPanelProps> = ({ onAddElement }) => {
  return (
    <div className="w-64 bg-white border border-gamma-gray rounded-xl shadow-lg p-4 flex flex-col space-y-4">
      <h3 className="text-lg font-bold text-gamma-dark mb-2">Elements</h3>
      <div className="grid grid-cols-2 gap-4">
        {ELEMENTS.map((svg, idx) => (
          <button
            key={idx}
            className="bg-gamma-bg rounded-lg p-2 hover:shadow-lg border border-transparent hover:border-gamma-blue transition"
            onClick={() => onAddElement(svg)}
            title="Add element"
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('text/plain', svg);
            }}
          >
            <img src={svg} alt={`Element ${idx + 1}`} className="w-16 h-16 object-contain" />
          </button>
        ))}
      </div>
      <p className="text-xs text-gamma-gray mt-2">Add more SVGs to <code>src/assets/elements/</code> to see them here.</p>
    </div>
  );
};

export default ElementsPanel; 