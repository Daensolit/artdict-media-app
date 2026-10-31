import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GlassSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  sublabel?: string;
}

export type GlassSelectOptionType = GlassSelectOption | string;

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly (GlassSelectOption | string)[] | (GlassSelectOption | string)[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function GlassSelect({
  value,
  onChange,
  options,
  placeholder = 'Chọn tùy chọn...',
  className = '',
  disabled = false,
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Chuẩn hóa options: chấp nhận cả mảng string hoặc mảng GlassSelectOption
  const normalizedOptions: GlassSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Đóng khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button - Apple Liquid Glass with Spring Tap */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={!disabled ? { scale: 0.985 } : undefined}
        className={`w-full px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between text-left transition-colors duration-200 
          bg-white/80 dark:bg-[#0c0e17]/70 backdrop-blur-xl 
          border text-slate-900 dark:text-zinc-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] cursor-pointer
          ${
            isOpen
              ? 'border-orange-500/80 dark:border-orange-400/80 ring-2 ring-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
              : 'border-slate-200/90 dark:border-white/[0.08] dark:border-t-white/[0.16] hover:border-slate-300 dark:hover:border-white/[0.18]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate font-medium ${!selectedOption ? 'text-zinc-400 dark:text-zinc-500' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.08] border border-white/10 text-zinc-400">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-orange-500 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-500'
          }`}
        />
      </motion.button>

      {/* Floating Popout Menu - Apple Spring Animation with visionOS Specular Rim Light */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 p-1.5 rounded-2xl max-h-64 overflow-y-auto 
              bg-white/95 dark:bg-[#0c0e18]/95 backdrop-blur-3xl 
              border border-slate-200/80 dark:border-white/[0.12] dark:border-t-white/[0.25] 
              shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(249,115,22,0.08)]"
          >
            <div className="space-y-1">
              {normalizedOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <motion.div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/30 shadow-sm'
                        : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.06] hover:text-orange-500 dark:hover:text-orange-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      {option.icon && (
                        <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
                          {option.icon}
                        </span>
                      )}
                      <div className="truncate">
                        <p className="truncate">{option.label}</p>
                        {option.sublabel && (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                            {option.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-orange-500 dark:text-orange-400 shrink-0 ml-2" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
