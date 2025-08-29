import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';


export default function CustomDropdown({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (v: string) => void; }) {
  const [isShowing, setIsShowing] = useState(false);
  let timeout: any;

  const handleMouseEnter = () => { clearTimeout(timeout); setIsShowing(true); };
  const handleMouseLeave = () => { timeout = setTimeout(() => setIsShowing(false), 200); };
  const handleSelect = (option: string) => { onSelect(option); setIsShowing(false); };

  return (
    <Popover className="relative inline-block">
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <Popover.Button as="div" className="inline-flex w-48 items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-2 text-slate-200 hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer select-none transition-all duration-200">
          <span className="truncate text-sm">
            {value ? (
              <>
                <span className="text-blue-400">{label}:</span> {value}
              </>
            ) : (
              <span className="text-slate-400">{label}</span>
            )}
          </span>
          <motion.div
            animate={{ rotate: isShowing ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="ml-2 h-4 w-4 text-blue-400" />
          </motion.div>
        </Popover.Button>
        <AnimatePresence>
        {isShowing && (
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
          <Popover.Panel static className="absolute left-0 z-10 mt-2 w-56 modal-content rounded-lg">
            <div className="p-2">
              <div className="max-h-48 overflow-y-auto">
                <motion.button 
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-blue-500/20 transition-colors" 
                  onClick={() => handleSelect('')}
                >
                  <span className="text-blue-400">Todos(as)</span>
                </motion.button>
                {options.map((option) => (
                  <motion.button 
                    key={option} 
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-blue-500/20 transition-colors" 
                    onClick={() => handleSelect(option)}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          </Popover.Panel>
        </Transition>
        )}
        </AnimatePresence>
      </div>
    </Popover>
  );
}
