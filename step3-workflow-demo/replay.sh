#!/bin/bash
# ============================================================================
# REPLAY: Cinematic demo replay with colored output and timing
# ============================================================================
DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

typing() {
  local text="$1"
  local i=0
  while [ $i -lt ${#text} ]; do
    printf '%s' "${text:$i:1}"
    i=$((i + 1))
    # Use perl for sub-second sleep (bash 3.2 compatible)
    perl -e 'select(undef,undef,undef,0.02)' 2>/dev/null || sleep 0
  done
  echo ""
}

pause() {
  perl -e "select(undef,undef,undef,$1)" 2>/dev/null || sleep "${1%.*}"
}

banner() {
  echo ""
  printf "${BOLD}${WHITE}"
  echo "═══════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "═══════════════════════════════════════════════════════════════"
  printf "${NC}"
  echo ""
}

agent_header() {
  local color="$1"
  local icon="$2"
  local name="$3"
  local desc="$4"
  echo ""
  printf "${color}${BOLD}  ┌─────────────────────────────────────────────────┐${NC}\n"
  printf "${color}${BOLD}  │  ${icon}  ${name}${NC}\n"
  printf "${color}${BOLD}  │  ${NC}${DIM}${desc}${NC}\n"
  printf "${color}${BOLD}  └─────────────────────────────────────────────────┘${NC}\n"
  echo ""
}

log_line() {
  local color="$1"
  local text="$2"
  printf "  ${color}▸${NC} ${text}\n"
  pause 0.4
}

# Clean previous run
rm -rf "$DEMO_DIR/demo-output" "$DEMO_DIR/HANDOFF.md"

clear
banner "OpenClaw Agentic Workflow Demo"
printf "  ${DIM}Scenario: New client onboarding at Hartwell Associates LLP${NC}\n"
printf "  ${DIM}Client: Meridian Supply Chain Solutions Ltd${NC}\n"
printf "  ${DIM}Matter: Commercial Contract Dispute (£4M value)${NC}\n"
echo ""
printf "  ${YELLOW}5 autonomous agents collaborate via HANDOFF.md${NC}\n"
printf "  ${YELLOW}Each agent reads the handoff, does its work, passes forward${NC}\n"
echo ""
pause 3

# --- TRIGGER ---
agent_header "$RED" "⚡" "TRIGGER — Intake Form Received" "New client form submitted via website"
pause 0.5
log_line "$RED" "Intake form received from Meridian Supply Chain Solutions Ltd"
log_line "$RED" "Contact: Sarah Chen, COO"
log_line "$RED" "Matter: Commercial dispute with GlobalFreight PLC — £4M value"
log_line "$RED" "Urgency: ${BOLD}HIGH${NC} — counterparty threatening termination"
log_line "$RED" "Referral: Marcus Webb, Deloitte"
bash "$DEMO_DIR/trigger.sh" > /dev/null 2>&1
log_line "$RED" "Created ${CYAN}intake.json${NC}"
log_line "$RED" "Initialized ${CYAN}HANDOFF.md${NC} → routing to EA Agent"
printf "\n  ${GREEN}${BOLD}✅ Trigger complete${NC}\n"
pause 1.5

# --- EA AGENT ---
agent_header "$BLUE" "📋" "EA AGENT — Executive Assistant" "Folder setup, welcome email, calendar scheduling"
pause 0.5
log_line "$BLUE" "Reading HANDOFF.md... ${GREEN}confirmed: routed to EA Agent${NC}"
log_line "$BLUE" "Parsing intake.json..."
pause 0.3
log_line "$BLUE" "Creating client folder: ${CYAN}client-folder/${NC} (7 subdirectories)"
log_line "$BLUE" "Assigning to Victoria Hartwell (Partner) + David Osei (Senior Associate)"
log_line "$BLUE" "Drafting welcome email to Sarah Chen..."
bash "$DEMO_DIR/ea-agent.sh" > /dev/null 2>&1
log_line "$BLUE" "Created ${CYAN}welcome-email.md${NC} — professional, SRA-compliant"
log_line "$BLUE" "Scheduling welcome call: ${WHITE}Mon 24 Feb, 10:00 GMT${NC}"
log_line "$BLUE" "Created ${CYAN}calendar-event.json${NC} with 8-point agenda"
log_line "$BLUE" "Updating HANDOFF.md → routing to Research Agent"
printf "\n  ${GREEN}${BOLD}✅ EA Agent complete${NC}\n"
pause 1.5

# --- RESEARCH AGENT ---
agent_header "$MAGENTA" "🔍" "RESEARCH AGENT — Intelligence & Compliance" "Conflict check, company research, risk assessment"
pause 0.5
log_line "$MAGENTA" "Reading HANDOFF.md... ${GREEN}confirmed: routed to Research Agent${NC}"
log_line "$MAGENTA" "Running conflict check — screening 6 entities..."
pause 0.8
log_line "$MAGENTA" "  Client:   Meridian SCS ............... ${GREEN}✅ Clear${NC}"
log_line "$MAGENTA" "  Opposing: GlobalFreight PLC .......... ${GREEN}✅ Clear${NC}"
log_line "$MAGENTA" "  Officers: Chen, Whitfield ............ ${GREEN}✅ Clear${NC}"
log_line "$MAGENTA" "  Referrer: Marcus Webb / Deloitte ..... ${GREEN}✅ Clear${NC}"
log_line "$MAGENTA" "Sanctions & PEP screening .............. ${GREEN}✅ No matches${NC}"
pause 0.5
log_line "$MAGENTA" "Compiling company intelligence..."
log_line "$MAGENTA" "  Meridian SCS: £12.4M revenue, 86 staff, Series A funded"
log_line "$MAGENTA" "  GlobalFreight PLC: AIM-listed, ${YELLOW}2 profit warnings${NC}, share price -18%"
log_line "$MAGENTA" "  Likely opposing solicitors: Clyde & Co"
bash "$DEMO_DIR/researcher-agent.sh" > /dev/null 2>&1
log_line "$MAGENTA" "Risk assessment: ${WHITE}Defence Medium-High | Counterclaim Strong${NC}"
log_line "$MAGENTA" "Identified 2 helpful case authorities"
log_line "$MAGENTA" "Created ${CYAN}conflict-check.md${NC} + ${CYAN}client-brief.md${NC}"
log_line "$MAGENTA" "Updating HANDOFF.md → routing to PM Agent"
printf "\n  ${GREEN}${BOLD}✅ Research Agent complete${NC}\n"
pause 1.5

# --- PM AGENT ---
agent_header "$YELLOW" "📊" "PM AGENT — Project Manager" "Project plan, milestones, risk register, budget"
pause 0.5
log_line "$YELLOW" "Reading HANDOFF.md... ${GREEN}confirmed: routed to PM Agent${NC}"
log_line "$YELLOW" "Ingesting research findings for planning context..."
pause 0.3
log_line "$YELLOW" "Building 4-phase project plan:"
log_line "$YELLOW" "  Phase 1: Intake & Assessment ......... 7 tasks → ${WHITE}7 Mar${NC}"
log_line "$YELLOW" "  Phase 2: Strategy & Pre-Action ....... 7 tasks → ${WHITE}28 Mar${NC}"
log_line "$YELLOW" "  Phase 3: Response & Negotiation ...... 5 tasks → ${WHITE}2 May${NC}"
log_line "$YELLOW" "  Phase 4: Litigation (contingent) ..... 5 tasks → ${WHITE}TBC${NC}"
bash "$DEMO_DIR/pm-agent.sh" > /dev/null 2>&1
log_line "$YELLOW" "Risk register: 4 risks identified with mitigations"
log_line "$YELLOW" "Budget estimate: ${WHITE}£33K–£50K${NC} pre-litigation"
log_line "$YELLOW" "Created ${CYAN}project-plan.md${NC}"
log_line "$YELLOW" "Updating HANDOFF.md → routing to Billing Agent"
printf "\n  ${GREEN}${BOLD}✅ PM Agent complete${NC}\n"
pause 1.5

# --- BILLING AGENT ---
agent_header "$CYAN" "💰" "BILLING AGENT — Bookkeeper" "Engagement letter, fee schedule, billing setup"
pause 0.5
log_line "$CYAN" "Reading HANDOFF.md... ${GREEN}confirmed: routed to Billing Agent${NC}"
log_line "$CYAN" "Ingesting budget estimates from PM Agent..."
pause 0.3
log_line "$CYAN" "Drafting engagement letter (10 sections, SRA-compliant)..."
log_line "$CYAN" "  Scope of work, personnel, fee estimate"
log_line "$CYAN" "  Billing terms: monthly, 30-day payment, £10K retainer"
log_line "$CYAN" "  Regulatory info, complaints procedure, termination"
bash "$DEMO_DIR/billing-agent.sh" > /dev/null 2>&1
log_line "$CYAN" "Rate card: Partner £550/hr → Trainee £125/hr"
log_line "$CYAN" "Created ${CYAN}engagement-letter.md${NC} + ${CYAN}fee-schedule.json${NC}"
log_line "$CYAN" "Updating HANDOFF.md → ${WHITE}PIPELINE COMPLETE${NC}"
printf "\n  ${GREEN}${BOLD}✅ Billing Agent complete${NC}\n"
pause 1

# --- SUMMARY ---
banner "Pipeline Complete — All 5 Agents Finished"

printf "  ${BOLD}Generated Artifacts:${NC}\n\n"
find "$DEMO_DIR/demo-output" -type f | sort | while read f; do
  name="${f#$DEMO_DIR/demo-output/}"
  case "$name" in
    intake.json)        icon="📥"; desc="Client intake data" ;;
    welcome-email.md)   icon="✉️ "; desc="Professional welcome email" ;;
    calendar-event.json) icon="📅"; desc="Welcome call with agenda" ;;
    conflict-check.md)  icon="🔒"; desc="Full conflict check report" ;;
    client-brief.md)    icon="📑"; desc="Intelligence brief + risk assessment" ;;
    project-plan.md)    icon="📊"; desc="19-task project plan with milestones" ;;
    engagement-letter.md) icon="📝"; desc="SRA-compliant engagement letter" ;;
    fee-schedule.json)  icon="💷"; desc="Rate card + billing configuration" ;;
    timeline.log)       icon="⏱️ "; desc="Full agent activity timeline" ;;
    *)                  icon="📄"; desc="$name" ;;
  esac
  if [ -d "$f" ]; then continue; fi
  printf "  ${icon}  ${WHITE}%-28s${NC} ${DIM}%s${NC}\n" "$name" "$desc"
done

echo ""
printf "  ${BOLD}Agent Communication:${NC}\n"
printf "  📋  ${WHITE}HANDOFF.md${NC}               ${DIM}File-based agent handoff log${NC}\n"
echo ""

TOTAL_LINES=$(wc -l < "$DEMO_DIR/demo-output/timeline.log" | tr -d ' ')
printf "  ${DIM}Timeline entries: ${TOTAL_LINES} | Agents: 5 | Artifacts: 9${NC}\n"
echo ""
printf "  ${GREEN}${BOLD}This is how OpenClaw agents collaborate:${NC}\n"
printf "  ${GREEN}Each agent reads HANDOFF.md, does its job, passes forward.${NC}\n"
printf "  ${GREEN}No central controller needed. Just agents and files.${NC}\n"
echo ""
