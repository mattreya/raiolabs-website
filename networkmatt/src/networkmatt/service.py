from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .models import AnalysisReport


@dataclass
class ApplianceState:
    mode: str = "unmanaged_observation"
    capture_paused: bool = False
    last_analysis: AnalysisReport | None = None
    candidate: dict[str, Any] | None = None
    candidate_approved: bool = False


class NetworkmattService:
    """In-memory simulation. No host networking or device configuration is changed."""

    def __init__(self) -> None:
        self._state = ApplianceState()

    def status(self) -> dict[str, Any]:
        analysis = self._state.last_analysis
        evidence_count = sum(len(item.evidence) for item in analysis.observations) if analysis else 0
        return {
            "product": "networkmatt",
            "simulation": True,
            "mode": self._state.mode,
            "capture": {
                "state": "paused" if self._state.capture_paused else "listening_not_connected",
                "source": None,
                "packet_capture_implemented": False,
            },
            "interfaces": [],
            "last_analysis_id": analysis.analysis_id if analysis else None,
            "observed_fields": [item.field for item in analysis.observations] if analysis else [],
            "evidence_reference_count": evidence_count,
            "candidate_available": self._state.candidate is not None,
            "candidate_approved": self._state.candidate_approved,
            "rollback_versions": 0,
        }

    def readiness(self) -> dict[str, Any]:
        report = self._state.last_analysis
        if report is None:
            return {
                "understands_network": False,
                "ready_for_passive_candidate": False,
                "reason": "No KEV analysis has been supplied yet.",
                "observed": [],
                "unknowns": [],
            }
        supported = [item for item in report.observations if item.evidence]
        ready = bool(supported)
        return {
            "understands_network": ready,
            "ready_for_passive_candidate": ready,
            "reason": (
                "Evidence is available to draft a passive candidate; unresolved items remain visible."
                if ready
                else "The analysis has no evidence-linked observations yet."
            ),
            "protocol": report.protocol,
            "observed": [asdict(item) for item in supported],
            "unknowns": list(report.unknowns),
            "inferences": list(report.inferences),
        }

    def ingest_analysis(self, payload: object) -> dict[str, Any]:
        if self._state.capture_paused:
            raise ValueError("Capture is paused; resume observation before ingesting analysis")
        report = AnalysisReport.from_mapping(payload)
        self._state.last_analysis = report
        self._state.candidate = None
        self._state.candidate_approved = False
        if self._state.mode != "passive_configured_simulation":
            self._state.mode = "unmanaged_observation"
        return self.readiness()

    def create_candidate(self) -> dict[str, Any]:
        readiness = self.readiness()
        if not readiness["ready_for_passive_candidate"]:
            raise ValueError("Not enough evidence to prepare a candidate")
        report = self._state.last_analysis
        assert report is not None
        self._state.candidate = {
            "candidate_id": str(uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "simulation": True,
            "mode": "passive_configured",
            "source_analysis_id": report.analysis_id,
            "protocol_observed": report.protocol,
            "observed_facts": [asdict(item) for item in report.observations],
            "unknowns": list(report.unknowns),
            "inferences": list(report.inferences),
            "routing_advertisements_enabled": False,
            "routing_adjacencies_enabled": False,
            "changes_applied": False,
            "review_note": "This is a simulated review artifact. No network configuration is applied.",
        }
        self._state.candidate_approved = False
        return self._state.candidate

    def candidate(self) -> dict[str, Any] | None:
        return self._state.candidate

    def approve_passive_candidate(self) -> dict[str, Any]:
        candidate = self._state.candidate
        if candidate is None:
            raise ValueError("Create and review a candidate before approving it")
        self._state.mode = "passive_configured_simulation"
        self._state.candidate_approved = True
        return {
            "simulation": True,
            "mode": self._state.mode,
            "candidate_id": candidate["candidate_id"],
            "configuration_applied": False,
            "message": "Demo approval recorded in memory; no device configuration was changed.",
        }

    def set_capture_paused(self, paused: bool) -> dict[str, Any]:
        self._state.capture_paused = paused
        return self.status()
