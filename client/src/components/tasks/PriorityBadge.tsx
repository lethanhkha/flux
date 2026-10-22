import React from 'react';
import { Tooltip } from '../common/Tooltip';
import { PRIORITY_TOOLTIPS } from '../../lib/taskUtils';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge = React.memo<PriorityBadgeProps>(({ priority }) => {
  const tip = PRIORITY_TOOLTIPS[priority] || PRIORITY_TOOLTIPS.MEDIUM;

  switch (priority) {
    case 'URGENT':
      return (
        <Tooltip content={tip}>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-bold cursor-help hover:scale-105 transition-transform inline-flex items-center gap-1 select-none">
            Khẩn cấp
          </span>
        </Tooltip>
      );
    case 'HIGH':
      return (
        <Tooltip content={tip}>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold cursor-help hover:scale-105 transition-transform inline-flex items-center gap-1 select-none">
            Ưu tiên cao
          </span>
        </Tooltip>
      );
    case 'MEDIUM':
      return (
        <Tooltip content={tip}>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 font-bold cursor-help hover:scale-105 transition-transform inline-flex items-center gap-1 select-none">
            Trung bình
          </span>
        </Tooltip>
      );
    case 'LOW':
    default:
      return (
        <Tooltip content={tip}>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 font-bold cursor-help hover:scale-105 transition-transform inline-flex items-center gap-1 select-none">
            Thấp
          </span>
        </Tooltip>
      );
  }
});

PriorityBadge.displayName = 'PriorityBadge';
