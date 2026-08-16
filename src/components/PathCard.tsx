import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PathType } from '@/types';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}#%&*+-=';
const ATTACHED_TRAILING_CHARS = new Set(['，', '。', '！', '？', '：', '；', '、', '」', '』', '》', '）', '】']);

type ScrambleUnit =
  | {
      text: string;
      type: 'fixed';
    }
  | {
      text: string;
      type: 'reveal';
    };

function buildRandomString(length: number) {
  return Array.from({ length }, () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]).join('');
}

function buildScrambleUnits(target: string) {
  return Array.from(target).reduce<ScrambleUnit[]>((units, character) => {
    if (character === '\n' || character.trim() === '') {
      units.push({ text: character, type: 'fixed' });
      return units;
    }

    const previousUnit = units[units.length - 1];

    if (ATTACHED_TRAILING_CHARS.has(character) && previousUnit?.type === 'reveal') {
      previousUnit.text += character;
      return units;
    }

    units.push({ text: character, type: 'reveal' });
    return units;
  }, []);
}

function buildScrambledText(target: string, progress: number) {
  const units = buildScrambleUnits(target);
  const revealThreshold = 0.94;
  const effectiveProgress =
    progress >= revealThreshold
      ? 1
      : Math.min(progress / revealThreshold, 0.999);
  const revealUnits = units.filter((unit) => unit.type === 'reveal');
  const revealCount = Math.floor(effectiveProgress * revealUnits.length);
  let revealed = 0;

  return units
    .map((unit) => {
      if (unit.type === 'fixed') {
        return unit.text;
      }

      if (revealed < revealCount) {
        revealed += 1;
        return unit.text;
      }

      return buildRandomString(unit.text.length);
    })
    .join('');
}

interface PathCardProps {
  pathType: PathType;
  title: string;
  mainText: string;
  cta: string;
  animationProgress?: number;
  onSelect: () => void;
}

/**
 * 路径选择卡片组件
 */
export const PathCard: React.FC<PathCardProps> = ({
  pathType,
  title,
  mainText,
  cta,
  animationProgress = 1,
  onSelect,
}) => {
  const displayText = React.useMemo(
    () => (animationProgress >= 1 ? mainText : buildScrambledText(mainText, animationProgress)),
    [animationProgress, mainText],
  );

  return (
    <Card
      data-path-card={pathType}
      className="surface-panel group h-full rounded-[1.5rem] border-border/80 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/70 hover:shadow-[0_18px_48px_hsl(var(--primary)/0.12)]"
    >
      <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-7">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="section-kicker">
              Path {pathType}
            </span>
            <span className="text-sm font-medium text-primary">
              {title}
            </span>
          </div>

          <div className="h-px w-full bg-border" />
        </div>

        {/* 主文案 - 引号内的用户心声 */}
        <p
          aria-label={mainText.replace(/\n/g, ' ')}
          className="min-h-[6.5rem] whitespace-pre-line break-words font-mono text-[1.08rem] leading-8 text-foreground sm:min-h-[7.5rem] sm:text-xl"
        >
          {displayText}
        </p>

        {/* CTA 按钮 */}
        <Button
          onClick={onSelect}
          variant="ghost"
          className="mt-auto h-auto w-full justify-between rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3.5 text-left text-base text-primary hover:bg-primary/10 hover:text-primary"
        >
          <span>{cta}</span>
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Button>
      </CardContent>
    </Card>
  );
};
