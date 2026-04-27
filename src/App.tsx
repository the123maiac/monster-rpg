import { Suspense, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { startGamepadPolling } from '@/systems/input';
import { useTutorial } from '@/systems/tutorial';
import { useAchievements } from '@/systems/achievements';
import { setSfxVolume } from '@/systems/sound';
import MainMenu from '@/components/ui/MainMenu';
import StarterSelection from '@/components/ui/StarterSelection';
import Overworld from '@/components/game/Overworld';
import DialogueBox from '@/components/ui/DialogueBox';
import BattleScreen from '@/components/ui/BattleScreen';
import PartyMenu from '@/components/ui/PartyMenu';
import PauseMenu from '@/components/ui/PauseMenu';
import QuestLog from '@/components/ui/QuestLog';
import Inventory from '@/components/ui/Inventory';
import Settings from '@/components/ui/Settings';
import HUD from '@/components/ui/HUD';
import Toast from '@/components/ui/Toast';
import Tutorial from '@/components/ui/Tutorial';
import Versus from '@/components/ui/Versus';
import Achievements from '@/components/ui/Achievements';
import AchievementToast from '@/components/ui/AchievementToast';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const fading = useGameStore((s) => s.fading);
  const dialogueActive = useGameStore((s) => s.dialogue.active);
  const sfxVolume = useGameStore((s) => s.settings.sfxVolume);

  const save = useGameStore((s) => s.save);
  useEffect(() => {
    if (screen === 'overworld') {
      const id = setTimeout(() => save(), 2000);
      return () => clearTimeout(id);
    }
  }, [screen, save]);

  useEffect(() => {
    startGamepadPolling();
    useTutorial.getState().load();
    useAchievements.getState().load();
  }, []);

  // Drive a tutorial step when the screen changes
  const tutorialActive = useTutorial((s) => s.active);
  const tutorialStepIdx = useTutorial((s) => s.stepIdx);
  const tutorialNext = useTutorial((s) => s.next);
  useEffect(() => {
    if (!tutorialActive) return;
    // Auto-advance steps when reaching their target screen
    const map: Record<number, string[]> = {
      2: ['overworld'],
      3: ['starter-selection'],
      4: ['overworld'],
      5: ['overworld'],
      6: ['battle'],
    };
    const required = map[tutorialStepIdx];
    if (required && required.includes(screen)) {
      // No-op: this means we're now on the right screen for showOn
    }
    // Specific transitions:
    // step 'find-prof' (idx 2) -> when starter-selection appears, auto advance
    if (tutorialStepIdx === 2 && screen === 'starter-selection') tutorialNext();
    // step 'pick-starter' (idx 3) -> when overworld appears, auto advance
    if (tutorialStepIdx === 3 && screen === 'overworld') tutorialNext();
    // step 'enter-grass' (idx 5) -> when battle appears, auto advance
    if (tutorialStepIdx === 5 && screen === 'battle') tutorialNext();
  }, [tutorialActive, tutorialStepIdx, screen, tutorialNext]);

  // Sync SFX volume to audio system
  useEffect(() => {
    setSfxVolume(sfxVolume);
  }, [sfxVolume]);

  return (
    <div className="w-full h-full relative">
      <Suspense fallback={<LoadingFallback />}>
        {(screen === 'overworld' || screen === 'pause') && <Overworld />}
        {(screen === 'overworld' || screen === 'pause') && <HUD />}

        {screen === 'main-menu' && <MainMenu />}
        {screen === 'starter-selection' && <StarterSelection />}
        {screen === 'battle' && <BattleScreen />}
        {screen === 'party' && <PartyMenu />}
        {screen === 'quests' && <QuestLog />}
        {screen === 'inventory' && <Inventory />}
        {screen === 'settings' && <Settings />}
        {screen === 'versus' && <Versus />}
        {screen === 'achievements' && <Achievements />}

        {dialogueActive && <DialogueBox />}
        {screen === 'pause' && <PauseMenu />}
        <Tutorial />
        <Toast />
        <AchievementToast />
      </Suspense>

      <div
        className="fade-overlay"
        style={{ opacity: fading ? 1 : 0, pointerEvents: 'none' }}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center menu-bg">
      <div className="text-amber-200 font-display text-xl">Loading…</div>
    </div>
  );
}
