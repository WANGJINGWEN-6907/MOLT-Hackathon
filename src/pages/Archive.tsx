import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createOrGetUser, getConversationsByUser, saveArchive } from '@/db/api';
import { getOrCreateAnonymousId } from '@/lib/anonymousUser';
import type { Conversation } from '@/types';
import type { MirrorFields } from '@/types/ai';

/**
 * Archive 灯塔建档页（Path C）
 * 展示轨迹摘要，设置公开意愿
 */
const Archive: React.FC = () => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const anonymousId = getOrCreateAnonymousId();
      const user = await createOrGetUser(anonymousId);
      
      if (user) {
        setUserId(user.id);
        const data = await getConversationsByUser(user.id, 'C');
        setConversations(data);
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleComplete = async () => {
    if (!userId) {
      toast.error('用户信息错误');
      return;
    }

    setIsSubmitting(true);

    try {
      // 从 localStorage 读取 Mirror 结构化字段（不存储原始 Q&A）
      const rawMirror = localStorage.getItem('molt_mirror_C')
      const mirrorFields: MirrorFields = rawMirror
        ? (JSON.parse(rawMirror) as MirrorFields)
        : { startPoint: null, turningPoint: null, currentState: null, lightMessage: null }

      // 只存储结构化字段，不含原始对话内容
      const structuredSummary = JSON.stringify({
        lightMessage: mirrorFields.lightMessage ?? '',
        startPoint: mirrorFields.startPoint ?? '',
        turningPoint: mirrorFields.turningPoint ?? '',
        currentState: mirrorFields.currentState ?? '',
        direction: '',
        city: '',
      })

      // 保存建档
      const archive = await saveArchive(userId, structuredSummary, isPublic);

      if (archive) {
        toast.success('建档完成！');
        navigate('/map');
      } else {
        toast.error('建档失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModify = () => {
    sessionStorage.removeItem('molt_conv_state_C')
    navigate('/conversation/C');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="max-w-3xl w-full space-y-8">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary font-mono neon-glow">
            成为灯塔
          </h1>
          <p className="text-muted-foreground">
            你的经历可以照亮他人的路
          </p>
        </div>

        {/* 模块一：轨迹摘要确认 */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl text-primary font-mono">
              你的轨迹摘要
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversations.map((conv, index) => (
              <div key={conv.id} className="space-y-2">
                <p className="text-sm text-primary font-mono">
                  Q{index + 1}: {conv.question_text}
                </p>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-primary">
                  {conv.answer_text}
                </p>
              </div>
            ))}
            <Button
              onClick={handleModify}
              variant="outline"
              size="sm"
              className="border-border hover:bg-secondary"
            >
              修改
            </Button>
          </CardContent>
        </Card>

        {/* 模块二：公开意愿设置 */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl text-primary font-mono">
              公开设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={isPublic ? 'public' : 'private'} onValueChange={(value) => setIsPublic(value === 'public')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="text-foreground cursor-pointer">
                  公开展示在地图上（其他用户可见）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="text-foreground cursor-pointer">
                  仅自己可见
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* 模块三：完成建档 */}
        <div className="flex justify-center">
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono px-8"
          >
            {isSubmitting ? '建档中...' : '完成建档'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Archive;
