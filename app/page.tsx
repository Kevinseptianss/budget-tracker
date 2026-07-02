"use client";

import React, { useState } from "react";
import { Container, Box } from "@mui/material";
import BottomNav, { ViewName } from "../components/BottomNav";
import HomeView from "../components/views/HomeView";
import StatsView from "../components/views/StatsView";
import TagsView from "../components/views/TagsView";
import HistoryView from "../components/views/HistoryView";
import HistoryDetailView from "../components/views/HistoryDetailView";
import AIChatView from "../components/views/AIChatView";

export default function BudgetTracker() {
  const [activeView, setActiveView] = useState<ViewName>("home");
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null
  );

  const handleViewChange = (view: ViewName) => {
    setActiveView(view);
    setSelectedHistoryId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectHistory = (id: string) => {
    setSelectedHistoryId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackFromHistory = () => {
    setSelectedHistoryId(null);
    setActiveView("history");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackFromAI = () => {
    setActiveView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (typeof window === "undefined") return null;

  const isAIMode = activeView === "ai" && !selectedHistoryId;
  const isHistoryDetail = !!selectedHistoryId;

  return (
    <Container
      maxWidth="md"
      sx={{
        pb: isAIMode ? 4 : 14,
        pt: 3,
        position: "relative",
        zIndex: 1,
      }}
    >
      {isHistoryDetail ? (
        <HistoryDetailView
          historyId={selectedHistoryId!}
          onBack={handleBackFromHistory}
        />
      ) : isAIMode ? (
        <AIChatView onBack={handleBackFromAI} />
      ) : (
        <>
          {activeView === "home" && <HomeView />}
          {activeView === "stats" && <StatsView />}
          {activeView === "tags" && <TagsView />}
          {activeView === "history" && (
            <HistoryView onSelectHistory={handleSelectHistory} />
          )}
          <BottomNav activeView={activeView} onViewChange={handleViewChange} />
        </>
      )}
    </Container>
  );
}
