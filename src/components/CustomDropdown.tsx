import { useState, Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';

const ChevronDownIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

export default function CustomDropdown({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (v: string) => void; }) {
  const [isShowing, setIsShowing] = useState(false);
  let timeout: any;

  const handleMouseEnter = () => { clearTimeout(timeout); setIsShowing(true); };
  const handleMouseLeave = () => { timeout = setTimeout(() => setIsShowing(false), 200); };
  const handleSelect = (option: string) => { onSelect(option); setIsShowing(false); };

  return (
    <Popover className="relative inline-block">
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <Popover.Button as="div" className="inline-flex w-44 items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-slate-200 hover:border-red-600 cursor-pointer select-none">
          <span className="truncate">{value ? `${label}: ${value}` : label}</span>
          <ChevronDownIcon className="ml-2 h-5 w-5 text-slate-300" aria-hidden="true" />
        </Popover.Button>
        <Transition
          show={isShowing}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel static className="absolute left-0 z-10 mt-2 w-56 rounded-md border border-zinc-800 bg-zinc-950">
            <div className="rounded-md border border-zinc-800 bg-zinc-950 p-1">
              <div className="max-h-48 overflow-y-auto">
                <button className="w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-zinc-900" onClick={() => handleSelect('')}>Todos(as)</button>
                {options.map((option) => (
                  <button key={option} className="w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-zinc-900" onClick={() => handleSelect(option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </div>
    </Popover>
  );
}
