import React from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

/**
 * 进度指示器组件
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ current, total }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <span className="text-primary font-mono text-lg neon-glow">
        {current + 1}
      </span>
      <span className="text-muted-foreground font-mono">
        /
      </span>
      <span className="text-muted-foreground font-mono text-lg">
        {total}
      </span>
    </div>
  );
};
