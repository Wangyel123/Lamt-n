# What the system needs: the evidence

Research done on 10 November 2026 to check that Lamtön helps every student, including those with no code, and doesn't create new risks. Each finding gives the evidence, how strong it is, and what it means for the system. Sources are at the end.

**Evidence strength:** **Strong** = systematic reviews, meta-analyses or randomised trials that agree. **Moderate** = one good trial or review, or consistent observational studies. **Early** = pilots, single studies or expert consensus.

## The short answer

1. **Help in a crisis must be open to everyone, any time, with no login.** The private conversation should stay behind a code, because the code is what lets a counsellor actually act on a disclosure.
2. **Bhutan already has the right number to show:** the **PEMA Helpline 1098** is free, confidential and open 24/7, and it serves children. Most young people in Bhutan already know it.
3. **Finding students is the easy part; following up is the hard part.** Screening finds many more students at risk, so the system's value depends on making sure every flagged student is contacted, without burying counsellors in alerts.

## Findings

### 1. Not knowing where to go stops young people getting help (Strong)
- **Evidence:** a systematic review of 53 studies (Radez et al. 2021) found the main barriers to young people seeking help are limited knowledge of mental health and of where to go (96% of studies), stigma and embarrassment (92%), and worries about confidentiality and trust (68%).
- **For Lamtön:** every extra step loses some students. Help can't depend on having a code, remembering a URL or signing in.
- **Done today:**
  - A public **`/help`** page (no sign-in, no code, short enough to print on a poster).
  - A "Need help right now? 1098" link on the start page.
  - A "No code, or lost it?" note on the code screen.
  - Tap-to-call buttons, so reaching someone takes one tap.

### 2. Bhutan's official helpline is 1098 (Official sources)
- **Evidence:**
  - PEMA, the national agency for mental health and child protection, runs the **PEMA Helpline 1098**. Its website calls it "confidential, 24/7" and "free", for "women, children, and anyone experiencing distress", with email helpline@thepema.gov.bt.
  - The Royal Bhutan Police list **113** for general emergencies and **112** for ambulance.
  - UNICEF Bhutan's OnMyMind campaign (2026) reports that 95.2% of respondents under 20 understood 1098 as a confidential source of mental-health and protection support.
- **For Lamtön:** show 1098 first. It's free, open all night and already familiar. The app previously showed "number to be confirmed".
- **Done today:**
  - The numbers are in one file, `lib/helpContacts.ts`, with their sources, and a unit test fails if they change.
  - Each school's counsellor office and hours are still `TODO(confirm with CECD)`.

### 3. Explaining confidentiality honestly increases disclosure (Strong, a randomised trial)
- **Evidence:** in a randomised trial, Ford et al. (JAMA 1997) found that assuring adolescents of confidentiality:
  - raised willingness to share sensitive information, including mental health, from 39% to 47%;
  - raised willingness to come back for care from 53% to 67%.

  The authors note that the limits must still be explained, because a professional can't keep risk of harm secret.
- **For Lamtön:** say clearly who sees what, and the one limit, in plain words. Never promise total secrecy.
- **Already in place:** "About this space" says this ("If you tell us you might be in danger, your counsellor will talk with you to help keep you safe"). The messages screen says "Only they read it".
- **Next:** show that one-line limit next to the message box too, not only on the About page.

### 4. Asking about self-harm does not put the idea in a young person's head (Strong)
- **Evidence:**
  - A meta-analysis of 13 prospective studies (DeCou & Schumann 2018) found no harmful effect of asking about suicide. The authors concluded universal screening is appropriate.
  - A second meta-analysis of 18 studies (Blades et al. 2018) found small *reductions* in suicidal thoughts after being asked, about twice as large in adolescents.
- **For Lamtön:** keep the direct self-harm question in the survey and the worry question in check-ins. Don't soften them into vaguer questions that miss students.

### 5. Screening finds many more students, which puts the load on follow-up (Moderate)
- **Evidence:**
  - In the SHIELD randomised trial (14 US high schools), universal screening found 7.1 times as many students at risk of suicide as teacher referral alone, and 4.0 times as many started treatment.
  - The authors warn that the suicide item drove most of the urgent follow-up load on schools.
  - Multi-stage ("multi-gate") screening, where a short second check follows a flag, improves identification and access to care.
  - Evidence that screening alone reduces suicide attempts is limited: the benefit depends on what happens after the flag.
- **For Lamtön:** the follow-up tools matter more than the flags:
  - the "Overdue: no contact within 24 hours" alert;
  - the caseload view;
  - the log of what the counsellor did (support actions) and the student timeline.
- **Next:**
  - Make the second check explicit with a "Seen and checked today" step for Urgent students.
  - Report **time from flag to first contact** to supervisors, with small numbers hidden, as the main measure of whether the system works.

### 6. Too many alerts get ignored (Strong, from healthcare software)
- **Evidence:**
  - Systematic reviews of clinical alert systems find that 46% to 96% of alerts are overridden (Poly et al. 2020).
  - Showing each role only the alerts it needs is the most effective way to reduce alert fatigue (Hussain et al. 2019).
- **For Lamtön:**
  - Keep loud alerts rare. Only Urgent is red, and there are at most two banners: overdue Urgent, and new words that need reading.
  - Supervisors get no student-level alerts at all.
  - Resist adding more banners. Any new signal should be a quiet badge, not an alert.

### 7. A safety plan on its own does not reduce suicidal behaviour in young people (Moderate)
- **Evidence:** a 2025 meta-analysis in JAMA Pediatrics found that safety-planning interventions on their own showed no significant effect on suicidal thoughts, behaviour or attempts in children and adolescents. The evidence base is small.
- **For Lamtön:** don't build a self-serve "safety plan" feature and present it as the answer. If one is added, it should be made *with* the counsellor, as part of their support.

### 8. Bhutan's students: a high need and overstretched counsellors (Moderate)
- **Evidence:**
  - In Bhutan's 2016 Global School-based Student Health Survey, 11.6% of school students had considered suicide and 11.3% had attempted it in the past year. Rates were higher among girls, and the linked risk factors were bullying, sexual violence, loneliness and drug use.
  - Bhutanese school counsellors report too few resources, stigma, and student-to-counsellor ratios too high to reach everyone in need.
  - In a 2017 study, 54% of secondary students used a smartphone to go online, often on shared devices.
- **For Lamtön:**
  - The survey's questions on bullying, safety at home and having a trusted adult match Bhutan's own risk factors.
  - Counsellor time is the scarcest thing, so every screen should save it: "who to see first", one-tap logging.
  - Shared devices make the "Leave" button and the automatic sign-out essential.
  - It must work on a phone and on slow connections.

### 9. Young people value privacy, flexibility and trust in digital support (Early to moderate)
- **Evidence:**
  - Reviews of digital mental-health support for youth find that people engage more when support is private, flexible (written, not live) and trusted.
  - Anonymity is a big draw: in one survey of 3,000 young people, almost a third chose online counselling mainly for anonymity.
  - Kooth's one-month pilot showed less distress and fewer suicidal thoughts. It was not a controlled trial.
  - Reviews recommend designing *with* young people (co-design).
- **For Lamtön:**
  - Messages being written and not live (asynchronous) is the right choice.
  - A private journal by default, with sharing optional, matches what young people want.
  - Before rollout, test the student screens with Bhutanese students in classes IV to XII.
  - **Trade-off to decide:** a fully anonymous "ask a question" box would reach more students, but a counsellor can't act on an anonymous disclosure of risk. If CECD wants it, it should show the helpline straight away for any worrying words, and never be the only way to get help.

### 10. Schools need more than an app (Moderate)
- **Evidence:**
  - WHO's LIVE LIFE guide names four core interventions: limit access to means, responsible media reporting, socio-emotional life skills for young people, and early identification and follow-up.
  - Training teachers as "gatekeepers" reliably improves their knowledge and confidence, but evidence that it changes behaviour is thin.
  - Classroom programmes for students, such as Youth Aware of Mental Health, have shown reductions in suicide attempts.
- **For Lamtön:**
  - It covers early identification and follow-up. It should be presented as one part of a school's plan, not the whole plan (the About page already says this).
  - Teachers are where a student with no code will turn. A simple "a teacher is worried about a student" referral, which adds the student to the counsellor's list, would close that gap.

## What is now in place

| Need (evidence) | In Lamtön |
|---|---|
| Help open to everyone, any time (1, 2) | Public `/help`, start-page link, "Get help now" before any code, tap-to-call 1098, 113, 112 |
| A path for students with no code (1) | "No code, or lost it?" on the code screen |
| Honest confidentiality (3) | "Who can see what" and the one limit on the About page; "Only they read it" on messages |
| Ask directly about self-harm (4) | The survey question is kept; check-ins ask about worry |
| Follow-up, not just flags (5) | Overdue-Urgent alert (24h), caseload, support log, timeline |
| Few, role-specific alerts (6) | Only Urgent is red; at most two banners; supervisors see counts only |
| Shared devices (8) | "Leave" button, automatic sign-out after 10 minutes |
| Private, written support (9) | Written (not live) messages to a human; private journal; no AI replies |

## Recommended next steps, in order

1. **CECD to confirm** each school's counsellor office, hours and reply time, and who re-checks the help numbers each term.
2. **Teacher referral** ("I'm worried about a student"): reaches students without codes (finding 10).
3. **Time from flag to first contact** for supervisors, with small numbers hidden: the measure that shows whether follow-up is happening (finding 5).
4. **Same-day second check** for Urgent students: a "Seen and checked today" step (finding 5).
5. **One-line confidentiality limit** beside the message box (finding 3).
6. **Test with students** in a few classes before rollout, then adjust the wording (finding 9).

## What not to do

- Don't put help behind a login or a code.
- Don't invent or copy numbers from unofficial lists. Several directories online disagree; only PEMA's and the Royal Bhutan Police's own sites were used.
- Don't add more alerts, colours or banners for counsellors.
- Don't promise students total secrecy.
- Don't present a self-serve safety plan or the app itself as treatment.
- Don't let any automatic text pretend to be the counsellor. There are no AI replies.

## A note on language

Low reading levels and unfamiliar words are among the main barriers (finding 1). The student screens are written for about class IV to V. Dzongkha was removed from this prototype's scope by decision; if the system goes to younger students or rural schools, testing whether a Dzongkha version raises use would be worthwhile.

## Sources

- **Help-seeking barriers:**
  - Radez J. et al. (2021). Why do children and adolescents (not) seek and access professional help for their mental health problems? A systematic review. *European Child & Adolescent Psychiatry* 30:183–211. [Southampton repository](https://eprints.soton.ac.uk/437629)
- **Help contacts in Bhutan:**
  - The PEMA, Response Services and Contact pages: helpline 1098, 24/7, confidential, free. [thepema.gov.bt](https://thepema.gov.bt/response-services)
  - Royal Bhutan Police, Emergency Contact Numbers: 113 general emergency, 112 ambulance, 110 fire. [rbp.gov.bt](https://rbp.gov.bt/?p=9641)
  - UNICEF Bhutan (2026), OnMyMind campaign. [unicef.org/bhutan](https://www.unicef.org/bhutan/stories/onmymind-campaign-calls-earlier-recognition-stress)
- **Confidentiality:**
  - Ford C.A. et al. (1997). Influence of physician confidentiality assurances on adolescents' willingness to disclose information and seek future health care. *JAMA* 278(12):1029–34. [PubMed 9307357](https://pubmed.ncbi.nlm.nih.gov/9307357/)
- **Asking about suicide:**
  - DeCou C.R. & Schumann M.E. (2018). On the iatrogenic risk of assessing suicidality: a meta-analysis. *Suicide and Life-Threatening Behavior*. [PubMed 30014862](https://pubmed.ncbi.nlm.nih.gov/30014862/)
  - Blades C.A. et al. (2018). The benefits and risks of asking research participants about suicide: a meta-analysis. *Clinical Psychology Review*. [UWA repository](https://research-repository.uwa.edu.au/en/publications/the-benefits-and-risks-of-asking-research-participants-about-suic/)
- **School screening:**
  - Universal vs targeted school screening (SHIELD trial secondary analysis). [PMC10249009](https://pmc.ncbi.nlm.nih.gov/articles/PMC10249009)
  - Anderson J.K. et al. (2018). Systematic review of school-based identification of children and young people at risk of mental health difficulties. *Psychological Medicine*. [Cambridge](https://core-prod.cambridgecore.org/core/services/aop-cambridge-core/content/view/398772E886954AA3BEC222B972A7AFB5/S0033291718002490a.pdf/systematic_review_of_effectiveness_and_costeffectiveness_of_schoolbased_identification_of_children_and_young_people_at_risk_of_or_currently_experiencing_mental_health_difficulties.pdf)
- **Alert fatigue:**
  - Poly T.N. et al. (2020). Appropriateness of overridden alerts in computerized physician order entry: systematic review. *JMIR Medical Informatics* 8(7):e15653. [JMIR](https://medinform.jmir.org/2020/7/e15653/PDF)
  - Hussain M.I., Reynolds T.L., Zheng K. (2019). Medication safety alert fatigue may be reduced via interaction design and clinical role tailoring. *JAMIA* 26(10). [PSNet](https://psnet.ahrq.gov/issue/medication-safety-alert-fatigue-may-be-reduced-interaction-design-and-clinical-role-tailoring)
- **Safety planning:**
  - Safety Planning Interventions for Suicide Prevention in Children and Adolescents: systematic review and meta-analysis (2025). *JAMA Pediatrics*. [PMC12090068](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12090068/)
- **Bhutan context:**
  - Suicidal ideation and attempt among school-going adolescents in Bhutan (GSHS 2016). *BMC Public Health* (2019). [PMC6889681](https://pmc.ncbi.nlm.nih.gov/articles/PMC6889681)
  - School guidance counsellors in Bhutan (qualitative study). [The Bhutanese](https://thebhutanese.bt/addressing-mental-health-issues-among-school-students-in-bhutan/)
  - Internet addiction among secondary school adolescents in Bhutan (2017 data). [PMC7580451](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7580451/)
- **Digital support for young people:**
  - Kooth pilot evaluation (2022). *BMC Public Health*. [PMC9555699](https://pmc.ncbi.nlm.nih.gov/articles/PMC9555699)
  - Opie J.E. et al. (2024). Youth user experience of digital mental health. *Clinical Child and Family Psychology Review*. [Springer](https://link.springer.com/article/10.1007/s10567-024-00468-5)
  - Co-design with young people for digital mental health: systematic review (2025). [PMC12163163](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12163163/)
  - #chatsafe guidelines (Orygen). [orygen.org.au](https://orygen.org.au/About/News-And-Events/2023/Social-media-a-safe-and-effective-way-to-reach-you)
- **Prevention programmes:**
  - WHO (2021). LIVE LIFE: an implementation guide for suicide prevention in countries. [who.int](https://www.who.int/initiatives/live-life-initiative-for-suicide-prevention)
  - Gatekeeper training for suicidal behaviors: a systematic review (2019). [PubMed 30599375](https://pubmed.ncbi.nlm.nih.gov/30599375/)
  - Orygen suicide-prevention research bulletin (SEYLE, YAM). [orygen.org.au](https://www.orygen.org.au/Research/Research-Areas/Suicide-Prevention/Orygen_Suicide_prevention_research_bulletin)
