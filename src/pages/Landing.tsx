import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useTypewriterText(target: string, stepDuration: number, delay = 0) {
  const [displayText, setDisplayText] = React.useState(() =>
    prefersReducedMotion() ? target : '',
  );

  React.useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion()) {
      setDisplayText(target);
      return undefined;
    }

    let frameId = 0;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;

      if (elapsed < delay) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      const revealedChars = Math.min(
        Math.floor((elapsed - delay) / stepDuration),
        target.length,
      );
      setDisplayText(target.slice(0, revealedChars));

      if (revealedChars < target.length) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      setDisplayText(target);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [delay, stepDuration, target]);

  return displayText;
}

const TypewriterHeadlineLine: React.FC<{
  className?: string;
  line: string;
  delay?: number;
  stepDuration: number;
}> = ({ className = '', line, delay = 0, stepDuration }) => {
  const displayText = useTypewriterText(line, stepDuration, delay);
  const isComplete = displayText === line;

  return (
    <span className={className} aria-hidden="true">
      <span>{displayText}</span>
      <span
        className={`typewriter-caret ${isComplete ? 'typewriter-caret-ready' : ''}`}
      >
        |
      </span>
    </span>
  );
};

function activateDemo(navigate: ReturnType<typeof useNavigate>) {
  if (import.meta.env.VITE_DEMO_MODE !== 'true') return;
  document.documentElement.requestFullscreen?.().catch(() => {});
  sessionStorage.setItem('molt_demo_mode', '1');
  navigate('/conversation/A?demo=1');
}

/**
 * Landing 页
 * 展示宣言和开始按钮
 */
const Landing: React.FC = () => {
  const navigate = useNavigate();
  const sequenceRef = React.useRef(0);
  const timerRef = React.useRef<number | null>(null);

  // URL trigger: ?demo=1
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      activateDemo(navigate);
    }
  }, [navigate]);

  // Keyboard sequence: d→e→m→o
  React.useEffect(() => {
    const TARGET = ['d', 'e', 'm', 'o'];

    const handler = (event: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (event.key.toLowerCase() === TARGET[sequenceRef.current]) {
        sequenceRef.current += 1;

        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          sequenceRef.current = 0;
        }, 3000);

        if (sequenceRef.current === TARGET.length) {
          sequenceRef.current = 0;
          if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          activateDemo(navigate);
        }
      } else {
        sequenceRef.current = 0;
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [navigate]);

  return (
    <div className="hero-shell hero-grid min-h-screen w-full overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="page-container flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <div className="surface-panel w-full max-w-4xl rounded-[2rem] px-5 py-10 text-center sm:px-10 sm:py-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 sm:gap-8">
            <p className="section-kicker">MOLT</p>

            <h1
              aria-label="你不是被时代淘汰的人你是正在换壳的人"
              className="flex flex-col items-center text-center font-bold leading-[1] tracking-[-0.04em] text-foreground"
            >
              <span className="block whitespace-nowrap text-[1.48rem] sm:text-6xl md:text-7xl">
                你不是被时代淘汰的人
              </span>
              <TypewriterHeadlineLine
                className="gradient-text mt-3 block whitespace-nowrap text-[1.34rem] sm:mt-4 sm:text-[3.35rem] md:text-[4.45rem]"
                line="你是正在换壳的人"
                stepDuration={110}
                delay={240}
              />
            </h1>

            <p className="mx-auto max-w-[18rem] text-pretty text-sm leading-7 text-muted-foreground sm:max-w-2xl sm:text-lg md:text-xl">
              这里不替你决定去哪里，只陪你把正在发生的变化慢慢看清。
            </p>

            <Button
              onClick={() => navigate('/onboarding')}
              size="lg"
              className="h-auto min-w-[13rem] rounded-full bg-primary px-8 py-4 font-mono text-base text-primary-foreground shadow-[0_0_32px_hsl(var(--primary)/0.18)] transition-transform hover:scale-[1.01] hover:bg-primary/90 sm:min-w-[14rem] sm:px-12 sm:py-5 sm:text-lg"
            >
              开始脱壳
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
