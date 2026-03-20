"use client";

import { useState } from "react";

import { ChatPanel } from "@/components/ChatPanel";
import { GlobalConfig } from "@/components/GlobalConfig";
import { NoteInspector } from "@/components/NoteInspector";
import { PianoRoll } from "@/components/PianoRoll";
import { Sidebar, SidebarTab } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { TransportBar } from "@/components/TransportBar";
import { useStudioState } from "@/hooks/useStudioState";

export default function StudioPage() {
  const [tab, setTab] = useState<SidebarTab>("chat");
  const studio = useStudioState();

  return (
    <div className="studio">
      <TopBar
        title={
          studio.composition?.melody.title ?? null
        }
        channels={
          studio.composition?.melody.channels ?? []
        }
        error={studio.error}
        isLoading={studio.isLoading}
        hasComposition={
          studio.composition !== null
        }
        onClearNotes={studio.clearComposition}
        onNewSession={studio.clearAll}
      />

      <div className="studio__body">
        <Sidebar activeTab={tab} onTabChange={setTab}>
          {tab === "chat" && (
            <ChatPanel
              messages={studio.messages}
              sessions={studio.sessions}
              isLoading={studio.isLoading}
              onSubmit={studio.handleSubmit}
              onLoadSession={
                studio.handleLoadSession
              }
              onDeleteSession={studio.deleteSession}
            />
          )}

          {tab === "config" && (
            <GlobalConfig
              config={studio.config}
              onConfigChange={studio.updateConfig}
            />
          )}

          {tab === "inspector" && (
            <NoteInspector
              note={
                studio.selectedNoteData?.note ?? null
              }
              channelId={
                studio.selectedNoteData?.channelId ??
                null
              }
              waveform={
                studio.selectedNoteData?.waveform ??
                null
              }
              adsr={
                studio.selectedNoteData?.adsr ?? null
              }
              onPitchChange={(v) =>
                studio.handleNoteUpdate({ pitch: v })
              }
              onOctaveChange={(v) =>
                studio.handleNoteUpdate({ octave: v })
              }
              onVelocityChange={(v) =>
                studio.handleNoteUpdate({
                  velocity: v,
                })
              }
              onDurationChange={(v) =>
                studio.handleNoteUpdate({
                  duration: v,
                })
              }
              onStartTimeChange={(v) =>
                studio.handleNoteUpdate({
                  start_time: v,
                })
              }
              onWaveformChange={
                studio.handleWaveformChange
              }
              onAdsrChange={studio.handleAdsrChange}
              onClose={studio.clearSelection}
            />
          )}
        </Sidebar>

        <main className="studio__main">
          <div className="studio__piano-roll">
            <PianoRoll
              channels={
                studio.composition?.melody.channels ??
                []
              }
              bpm={
                studio.composition?.melody.bpm ??
                studio.config.bpm
              }
              playheadTime={studio.elapsed}
              onNoteClick={(chId, idx) => {
                studio.handleNoteClick(chId, idx);
                setTab("inspector");
              }}
              onKeyDown={studio.playKeyNote}
              onKeyUp={studio.stopKeyNote}
              selectedChannelId={
                studio.selected?.channelId ?? null
              }
              selectedNoteIndex={
                studio.selected?.noteIndex ?? null
              }
            />
          </div>

          <TransportBar
            isPlaying={studio.isPlaying}
            elapsed={studio.elapsed}
            bpm={studio.config.bpm}
            currentPreset={studio.currentPreset}
            onPlay={studio.handlePlay}
            onStop={studio.stop}
            onRewind={studio.rewind}
            onBpmChange={studio.handleBpmChange}
            onPresetChange={
              studio.handlePresetChange
            }
          />
        </main>
      </div>
    </div>
  );
}
