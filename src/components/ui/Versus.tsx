import { useEffect, useMemo, useState } from 'react';
import { SPECIES } from '@/data/creatures';
import { useGameStore } from '@/store/gameStore';
import {
  getDailyChallenge,
  instantiateSharedParty,
  loadDailyRecord,
  packTeam,
  unpackTeam,
  type SharedTeam,
} from '@/systems/multiplayer';
import { sfx } from '@/systems/sound';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-white/60',
  uncommon: 'text-emerald-300',
  rare: 'text-sky-300',
  legendary: 'text-amber-300',
};

export default function Versus() {
  const setScreen = useGameStore((s) => s.setScreen);
  const player = useGameStore((s) => s.player);
  const startPvpBattle = useGameStore((s) => s.startPvpBattle);

  const [tab, setTab] = useState<'daily' | 'challenge' | 'share'>('daily');
  const [importedCode, setImportedCode] = useState('');
  const [imported, setImported] = useState<SharedTeam | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const dailyChallenge = useMemo(() => getDailyChallenge(), []);
  const dailyRecord = loadDailyRecord();

  const myCode = useMemo(() => packTeam(player.name, player.party), [player.party, player.name]);

  const handleImport = () => {
    const team = unpackTeam(importedCode.trim());
    if (!team) {
      setImportErr('That code looks invalid. Make sure you copied the whole thing.');
      sfx.cancel();
      return;
    }
    setImportErr(null);
    setImported(team);
    sfx.confirm();
  };

  const startDaily = () => {
    const team = instantiateSharedParty(dailyChallenge.team);
    sfx.confirm();
    startPvpBattle('daily', dailyChallenge.team.trainerName, team);
  };

  const startChallenge = () => {
    if (!imported) return;
    const team = instantiateSharedParty(imported);
    sfx.confirm();
    startPvpBattle('friend', imported.trainerName, team);
  };

  const copy = (s: string, label = 'Copied!') => {
    navigator.clipboard.writeText(s).then(() => {
      setCopyToast(label);
      sfx.click();
      setTimeout(() => setCopyToast(null), 1500);
    });
  };

  return (
    <div className="menu-bg w-full h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-display font-bold">Versus Mode</h2>
        <button className="btn-ghost text-sm" onClick={() => setScreen('main-menu')}>
          ← Back
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <TabBtn active={tab === 'daily'} onClick={() => setTab('daily')}>
          ☀ Daily Challenge
        </TabBtn>
        <TabBtn active={tab === 'challenge'} onClick={() => setTab('challenge')}>
          ⚔️ Accept Code
        </TabBtn>
        <TabBtn active={tab === 'share'} onClick={() => setTab('share')}>
          📨 Send Challenge
        </TabBtn>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'daily' && (
          <div className="panel p-5 max-w-2xl">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-amber-300">Today's Challenger</div>
                <h3 className="text-3xl font-display font-bold">{dailyChallenge.team.trainerName}</h3>
                <div className="text-white/50 text-xs">{dailyChallenge.seed}</div>
              </div>
              <div className="text-right text-sm">
                <div>Best: <span className="font-mono text-amber-300 text-lg">{dailyRecord.bestTurns ?? '—'}</span> turns</div>
                <div className="text-white/60">Attempts today: {dailyRecord.attempts}</div>
              </div>
            </div>
            <p className="text-white/75 text-sm italic mt-2">
              A new champion arrives every day. Beat them in as few turns as possible. Everyone faces the same lineup.
            </p>
            <TeamPreview team={dailyChallenge.team} />
            <div className="flex gap-2 mt-4 justify-end">
              <button className="btn-primary" onClick={startDaily} disabled={player.party.length === 0}>
                Battle!
              </button>
            </div>
            {player.party.length === 0 && (
              <div className="text-rose-300 text-sm mt-2">You need a party first. Start the main game to choose a starter.</div>
            )}
          </div>
        )}

        {tab === 'challenge' && (
          <div className="panel p-5 max-w-2xl">
            <h3 className="font-display font-bold text-lg">Accept a friend's challenge</h3>
            <p className="text-white/70 text-sm mt-1">
              Paste a battle code shared with you and fight against your friend's team. The team is AI-controlled with their actual stats.
            </p>
            <textarea
              value={importedCode}
              onChange={(e) => {
                setImportedCode(e.target.value);
                setImported(null);
                setImportErr(null);
              }}
              placeholder="Paste battle code here…"
              className="w-full mt-3 p-3 rounded-lg bg-slate-900/70 border border-white/10 text-white font-mono text-xs h-28 resize-none focus:outline-none focus:border-amber-300/60"
            />
            {importErr && <div className="text-rose-300 text-sm mt-1">{importErr}</div>}
            <div className="flex gap-2 mt-3">
              <button className="btn-secondary" onClick={handleImport}>
                Validate Code
              </button>
              {imported && (
                <button className="btn-primary" onClick={startChallenge} disabled={player.party.length === 0}>
                  Battle {imported.trainerName}!
                </button>
              )}
            </div>
            {imported && (
              <>
                <div className="mt-4 text-sm text-white/80">
                  Team from <span className="font-display font-bold text-amber-200">{imported.trainerName}</span>:
                </div>
                <TeamPreview team={imported} />
              </>
            )}
          </div>
        )}

        {tab === 'share' && (
          <div className="panel p-5 max-w-2xl">
            <h3 className="font-display font-bold text-lg">Send your team as a challenge</h3>
            <p className="text-white/70 text-sm mt-1">
              Copy your code and send it to a friend over any chat. They paste it under "Accept Code" and battle your team.
            </p>
            {player.party.length === 0 ? (
              <div className="text-rose-300 text-sm mt-3">You don't have a team yet. Start the main game first.</div>
            ) : (
              <>
                <textarea
                  value={myCode}
                  readOnly
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full mt-3 p-3 rounded-lg bg-slate-900/70 border border-white/10 text-white font-mono text-xs h-28 resize-none focus:outline-none focus:border-amber-300/60"
                />
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary" onClick={() => copy(myCode)}>
                    Copy Code
                  </button>
                  {copyToast && <div className="self-center text-emerald-300 text-sm">{copyToast}</div>}
                </div>
                <div className="mt-4 text-sm text-white/70">Your current team:</div>
                <TeamPreview team={{ trainerName: player.name, party: player.party.map((p) => ({
                  speciesId: p.speciesId, level: p.level, iv: p.iv, shiny: p.shiny, nickname: p.nickname,
                })), signedAt: Date.now() }} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-display text-sm transition-all ${
        active ? 'bg-amber-300/20 border-2 border-amber-300/60 -translate-y-0.5' : 'bg-slate-800/60 border-2 border-white/10 hover:bg-slate-700/70'
      }`}
    >
      {children}
    </button>
  );
}

function TeamPreview({ team }: { team: SharedTeam }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
      {team.party.map((p, i) => {
        const sp = SPECIES[p.speciesId];
        if (!sp) return null;
        return (
          <div key={i} className="p-3 rounded-lg bg-slate-800/70 border border-white/10">
            <div className="flex justify-between items-baseline">
              <span className="font-display font-semibold">
                {sp.name}
                {p.shiny && <span className="text-amber-300 ml-1">✦</span>}
              </span>
              <span className="font-mono text-xs text-amber-300">Lv {p.level}</span>
            </div>
            <div className="flex gap-1 mt-1">
              <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700`}>
                {sp.element}
              </span>
              <span className={`text-[10px] uppercase tracking-wider ${RARITY_COLORS[sp.rarity]}`}>
                {sp.rarity}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
