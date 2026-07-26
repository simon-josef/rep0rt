#!/usr/bin/env python3
"""One-off content generator, not part of the served site.

Produces assets/reports-data.js from the plain-text report bodies below.
Metadata (id/title/discipline/author/date/tags) stays plain since it is
catalog information, not prose. Each report's prose sections are bundled
into one JSON blob and base64-encoded so the shipped .js file never
contains readable body text. Re-run after editing the REPORTS list:

    python3 scripts/gen_reports_data.py
"""
import base64
import json
import textwrap

REPORTS = [
    dict(
        id="psy-001",
        title="Growth-mindset framing does not improve retention in an intro statistics course",
        discipline="psy",
        author="J. Okafor",
        date="2026-03-14",
        tags=["growth mindset", "education", "replication", "null result"],
        data_available=True,
        abstract="A single-session growth-mindset intervention was delivered to 214 students "
                 "in an introductory statistics course before their first exam. Relative to a "
                 "study-skills control video of matched length, the intervention produced no "
                 "detectable change in final-exam retention eight weeks later ($p = 0.61$, "
                 "$d = 0.04$, 95% CI $[-0.14, 0.11]$).",
        theory="Prior small-sample studies reported that framing ability as malleable rather "
               "than fixed reduces anxiety and increases persistence on difficult material, "
               "which should in turn improve long-term retention of quantitative content. "
               "We expected the intervention group to outperform controls on a delayed "
               "retention quiz covering material from the first third of the course.",
        hypothesis="Students who receive a growth-mindset framing video will score higher on "
                   "an eight-week delayed retention quiz than students who receive a "
                   "study-skills control video.",
        results="No significant between-group difference emerged on the delayed quiz "
                "($M_{growth}=71.2$, $M_{control}=70.6$, $t(212)=0.51$, $p=0.61$). A planned "
                "subgroup analysis by prior math anxiety also showed no interaction "
                "($p=0.44$). Self-reported mindset beliefs did shift post-intervention "
                "($p<0.01$), but this shift did not mediate retention scores.",
        reflections="The manipulation moved self-reported beliefs without moving the outcome "
                    "we actually cared about, which is a useful null in itself. A single "
                    "10-minute video delivered once may be too weak a dose to affect behavior "
                    "over eight weeks; classroom-embedded, repeated framing might behave "
                    "differently, and this design cannot rule that out.",
        literature="Yeager & Dweck (2019) on mindset intervention scaling; Sisk et al. (2018) "
                   "meta-analysis showing small and heterogeneous mindset effects; Bahnik & "
                   "Vranka (2017) failed classroom replication.",
        figures=["Distribution of delayed retention scores by condition (violin plot).",
                 "Mindset belief shift, pre- vs. post-intervention, by condition."],
    ),
    dict(
        id="cogsci-002",
        title="Working-memory capacity does not predict garden-path recovery time",
        discipline="cogsci",
        author="L. Meunier",
        date="2026-01-22",
        tags=["working memory", "sentence processing", "eye-tracking", "individual differences"],
        data_available=True,
        abstract="Using eye-tracking during reading, we measured reanalysis time on garden-path "
                 "sentences (e.g. \"The horse raced past the barn fell\") in 88 adults whose "
                 "working-memory span had been independently assessed. Span scores did not "
                 "correlate with regression-path duration at the disambiguating region "
                 "($r = 0.06$, $p = 0.58$).",
        theory="Capacity-based accounts of sentence processing predict that readers with "
               "larger working-memory spans should maintain multiple syntactic analyses "
               "longer and recover from misparses faster, since reanalysis is thought to draw "
               "on the same resource pool as span tasks.",
        hypothesis="Complex-span score will negatively correlate with regression-path duration "
                   "at the disambiguating word of a garden-path sentence.",
        results="Regression-path duration showed no reliable relationship with span "
                "($r=0.06$, $p=0.58$, $n=88$), and the null held after controlling for "
                "reading speed and sentence length ($\\beta=0.04$, $p=0.61$). Garden-path "
                "effects themselves were robust (disambiguation cost $\\approx 340$ms, "
                "$p<0.001$), confirming the paradigm was sensitive.",
        reflections="The paradigm clearly detected the garden-path effect, which rules out a "
                    "trivial power explanation for the null correlation. It's possible span "
                    "tasks and online reanalysis simply draw on different resources, or that "
                    "the relationship only appears under dual-task load, which this design "
                    "did not impose.",
        literature="Just & Carpenter (1992) capacity theory; Caplan & Waters (1999) critique "
                   "of resource-based sentence processing; Van Dyke & McElree (2011) on "
                   "interference vs. capacity accounts.",
        figures=["Scatterplot of complex-span score vs. regression-path duration."],
    ),
    dict(
        id="neuro-003",
        title="tDCS over left DLPFC fails to modulate risk-taking in the Balloon Analogue Risk Task",
        discipline="neuro",
        author="R. Ionescu",
        date="2025-11-08",
        tags=["tDCS", "prefrontal cortex", "risk-taking", "non-invasive stimulation"],
        data_available=False,
        abstract="Sixty participants completed the Balloon Analogue Risk Task (BART) during "
                 "anodal, cathodal, or sham transcranial direct current stimulation (tDCS) "
                 "over left dorsolateral prefrontal cortex. Adjusted average pumps, our primary "
                 "risk-taking measure, did not differ across stimulation conditions "
                 "($F(2,57)=0.71$, $p=0.50$).",
        theory="Left DLPFC is implicated in impulse control and value-based decision-making. "
               "We expected anodal (excitatory) stimulation to increase deliberation and lower "
               "risk-taking, and cathodal (inhibitory) stimulation to have the opposite effect, "
               "relative to sham.",
        hypothesis="Adjusted average BART pumps will be lower under anodal and higher under "
                   "cathodal stimulation relative to sham.",
        results="No main effect of stimulation condition on adjusted pumps ($p=0.50$), and no "
                "effect on secondary measures (balloon explosion rate, response latency). "
                "A single-blind manipulation check confirmed participants could not reliably "
                "guess their condition, so blinding was intact.",
        reflections="Montage and current density followed a published protocol, so this is "
                    "unlikely to be a dosing artifact alone, though we cannot exclude it. The "
                    "null is consistent with a growing literature questioning the reliability "
                    "of single-session prefrontal tDCS effects on complex decision tasks.",
        literature="Fecteau et al. (2007) original DLPFC-BART tDCS report; Medeiros et al. "
                   "(2012) review of inconsistent tDCS decision-making effects; Horvath et al. "
                   "(2015) meta-analysis questioning single-session tDCS efficacy.",
        figures=["Adjusted average pumps by stimulation condition (box plot).",
                 "Electrode montage and current density diagram."],
    ),
    dict(
        id="physics-004",
        title="No detectable deviation from Beer-Lambert linearity in dilute colloidal suspensions up to 5% v/v",
        discipline="physics",
        author="A. Kowalczyk",
        date="2025-09-30",
        tags=["optics", "colloids", "Beer-Lambert law", "scattering"],
        data_available=True,
        abstract="We measured optical extinction of polystyrene microsphere suspensions "
                 "(220 nm diameter) across concentrations from 0.1% to 5% v/v, testing whether "
                 "multiple scattering produces measurable deviation from Beer-Lambert linearity, "
                 "$A = \\varepsilon c l$. Extinction remained linear in concentration across the "
                 "full range ($R^2 = 0.997$), with residuals showing no systematic curvature.",
        theory="At sufficiently high particle density, multiple scattering events should couple "
               "concentration and path length nonlinearly, causing measured absorbance to "
               "fall below the value predicted by the linear Beer-Lambert relation. Prior "
               "reports place this onset around 3-4% v/v for similarly sized particles.",
        hypothesis="Absorbance will deviate negatively from the linear Beer-Lambert prediction "
                   "for concentrations above approximately 3% v/v.",
        results="A linear fit across all nine concentrations yielded $R^2 = 0.997$ with no "
                "significant quadratic term when a $A = \\varepsilon c l + \\gamma c^2$ model "
                "was fit ($\\gamma$ not distinguishable from zero, $p=0.32$). Residuals at 5% "
                "v/v were within instrument noise.",
        reflections="Our path length (1 cm cuvette) may simply be short enough that multiple "
                    "scattering stays negligible at these concentrations; longer path lengths "
                    "or larger particle sizes might reveal the predicted deviation. This bounds, "
                    "rather than closes, the question for this particle size and geometry.",
        literature="Bohren & Huffman (1983) scattering theory; Mie (1908) original scattering "
                   "solution; Berne & Pecora (2000) dynamic light scattering in concentrated "
                   "suspensions.",
        figures=["Absorbance vs. concentration with linear fit and residuals."],
    ),
    dict(
        id="chem-005",
        title="Copper(I) catalyst shows no rate enhancement over uncatalyzed background below 0°C",
        discipline="chem",
        author="S. Haddad",
        date="2025-08-17",
        tags=["click chemistry", "catalysis", "kinetics", "low temperature"],
        data_available=False,
        abstract="We measured the rate of azide-alkyne cycloaddition with and without a "
                 "Cu(I) catalyst at temperatures from -20°C to 0°C, where catalyst "
                 "solubility and turnover are both expected to be poor. Below 0°C, "
                 "catalyzed and uncatalyzed rate constants were statistically "
                 "indistinguishable ($p=0.71$).",
        theory="Cu(I)-catalyzed cycloaddition normally accelerates the reaction by several "
               "orders of magnitude at room temperature by lowering the activation barrier "
               "through a copper-acetylide intermediate. We expected this rate enhancement to "
               "persist, if attenuated, at low temperature.",
        hypothesis="The Cu(I)-catalyzed rate constant will exceed the uncatalyzed rate "
                   "constant at all tested temperatures, including below 0°C.",
        results="Uncatalyzed and catalyzed rate constants converged below 0°C "
                "($k_{cat}/k_{uncat} \\approx 1.1$, $p=0.71$), a sharp contrast to the "
                "roughly $10^3$-fold enhancement observed at 25°C in the same solvent "
                "system. Catalyst solubility, verified by UV-Vis, dropped markedly over the "
                "same range.",
        reflections="This looks best explained by catalyst precipitation/aggregation at low "
                    "temperature rather than a change in intrinsic mechanism, but we did not "
                    "directly image aggregate formation, so that remains an inference rather "
                    "than a demonstrated cause.",
        literature="Rostovtsev et al. (2002) original CuAAC report; Himo et al. (2005) "
                   "mechanistic DFT study; Worrell et al. (2013) on catalytically active "
                   "copper species.",
        figures=["Arrhenius plot, catalyzed vs. uncatalyzed rate constants."],
    ),
    dict(
        id="bio-006",
        title="Dietary resveratrol supplementation does not extend lifespan in outbred Drosophila melanogaster",
        discipline="bio",
        author="T. Nakashima",
        date="2025-06-02",
        tags=["resveratrol", "lifespan", "Drosophila", "aging"],
        data_available=True,
        abstract="Outbred Drosophila melanogaster (n=480, both sexes) were reared on standard "
                 "medium supplemented with resveratrol at 0, 100, or 400 μM. Median "
                 "and maximum lifespan did not differ from unsupplemented controls at either "
                 "dose (log-rank $p=0.34$).",
        theory="Resveratrol has been reported to activate sirtuin deacetylases and extend "
               "lifespan in yeast, worms, and some fly strains, generating substantial "
               "interest as a caloric-restriction mimetic. We expected supplementation to "
               "produce a modest but detectable lifespan extension in an outbred background.",
        hypothesis="Flies reared on resveratrol-supplemented medium will show extended median "
                   "and maximum lifespan relative to unsupplemented controls.",
        results="Survival curves for all three groups overlapped substantially (log-rank "
                "$p=0.34$ overall), with median lifespan within two days across conditions. "
                "Fecundity and body mass, tracked as covariates, also showed no dose-related "
                "trend.",
        reflections="Effects previously reported in inbred lab strains may depend on genetic "
                    "background or on caloric-restriction conditions we did not impose here; "
                    "our standard, non-restricted medium may simply not be the context where "
                    "resveratrol's reported mechanism matters.",
        literature="Wood et al. (2004) original Drosophila resveratrol report; Bass et al. "
                   "(2007) failure to replicate under standard diet; Baur & Sinclair (2006) "
                   "sirtuin-activator review.",
        figures=["Kaplan-Meier survival curves by resveratrol dose."],
    ),
    dict(
        id="cs-007",
        title="Attention dropout does not reduce overfitting in small-scale transformer fine-tuning",
        discipline="cs",
        author="D. Alvarado",
        date="2026-02-10",
        tags=["transformers", "regularization", "overfitting", "NLP"],
        data_available=True,
        abstract="We fine-tuned a 125M-parameter transformer on a 4k-example classification "
                 "set under five attention-dropout rates $p_{drop} \\in \\{0, 0.1, 0.2, 0.3, "
                 "0.4\\}$. Validation loss at the best checkpoint did not differ meaningfully "
                 "across dropout rates (range 0.402-0.411), and the train-validation gap was "
                 "not reduced at higher dropout.",
        theory="Dropout applied to attention weights is commonly recommended as a "
               "regularizer for small fine-tuning sets, on the assumption that it prevents "
               "individual attention heads from over-specializing to training examples.",
        hypothesis="Higher attention-dropout rates will reduce the train-validation loss gap "
                   "and improve validation loss relative to $p_{drop}=0$.",
        results="Validation loss was flat across dropout rates (0.402 at $p_{drop}=0$ vs. "
                "0.411 at $p_{drop}=0.4$), and the train-validation gap actually widened "
                "slightly at the highest dropout rate as training loss rose. Early stopping "
                "on validation loss selected checkpoints from similar epochs across all "
                "conditions.",
        reflections="At this model scale relative to dataset size, weight decay and early "
                    "stopping may already be doing most of the regularizing work, leaving "
                    "attention dropout with little left to contribute; the picture could "
                    "differ at larger model or smaller data scale.",
        literature="Srivastava et al. (2014) original dropout paper; Fan et al. (2019) "
                   "structured dropout for transformers; Mosbach et al. (2021) on "
                   "fine-tuning instability at small scale.",
        figures=["Validation loss vs. attention dropout rate.",
                 "Train/validation loss curves for $p_{drop}=0$ and $p_{drop}=0.4$."],
    ),
    dict(
        id="stat-008",
        title="Bootstrap and asymptotic intervals show no coverage difference for skewed counts at n=200",
        discipline="stat",
        author="M. Petrov",
        date="2025-12-05",
        tags=["bootstrap", "coverage", "count data", "simulation"],
        data_available=True,
        abstract="In a simulation study with 10,000 replicates, we compared empirical coverage "
                 "of percentile-bootstrap and asymptotic-normal confidence intervals for the "
                 "mean of a right-skewed negative-binomial count variable at $n=200$. Coverage "
                 "was statistically indistinguishable between methods at the nominal 95% level "
                 "($92.6\\%$ vs. $92.9\\%$, $p=0.38$).",
        theory="Bootstrap intervals are often recommended over asymptotic-normal intervals for "
               "skewed distributions on the grounds that they do not assume symmetry of the "
               "sampling distribution. We expected this advantage to produce measurably better "
               "coverage at a moderate sample size.",
        hypothesis="Percentile-bootstrap intervals will show closer-to-nominal coverage than "
                   "asymptotic-normal intervals at $n=200$ for right-skewed count data.",
        results="Both methods under-covered the nominal $95\\%$ target to a similar degree "
                "($92.6\\%$ bootstrap vs. $92.9\\%$ asymptotic, difference $p=0.38$ across "
                "10,000 replicates), and interval widths were nearly identical on average. "
                "The BCa correction improved bootstrap coverage marginally, to $93.4\\%$, "
                "still not reliably above the asymptotic interval.",
        reflections="At $n=200$ the central limit theorem may already be doing enough work for "
                    "this level of skew that the bootstrap's extra flexibility isn't needed; "
                    "more extreme skew or smaller $n$ could plausibly separate the two methods, "
                    "and we did not sweep those settings here.",
        literature="Efron & Tibshirani (1993) bootstrap methods text; DiCiccio & Efron (1996) "
                   "on BCa intervals; Wilcox (2012) on robust interval estimation for skewed "
                   "data.",
        figures=["Empirical coverage by method across simulation replicates."],
    ),
    dict(
        id="econ-009",
        title="Minimum-wage increases in mid-size US counties show no measurable teen-employment effect, 2015-2023",
        discipline="econ",
        author="C. Whitfield",
        date="2025-10-19",
        tags=["minimum wage", "labor economics", "difference-in-differences", "employment"],
        data_available=False,
        abstract="Using a difference-in-differences design across 46 mid-size US counties that "
                 "raised local minimum wages between 2015 and 2023, matched to demographically "
                 "similar counties that did not, we find no statistically significant effect "
                 "on teen (16-19) employment-to-population ratios ($\\hat{\\beta}=-0.004$, "
                 "SE $=0.006$).",
        theory="Standard competitive labor-market models predict that binding minimum-wage "
               "increases reduce employment among low-wage, low-experience workers, with teens "
               "considered a group especially exposed to this margin.",
        hypothesis="Counties that raised minimum wages will show a relative decline in teen "
                   "employment-to-population ratio compared to matched control counties.",
        results="The estimated treatment effect was small and not statistically distinguishable "
                "from zero ($\\hat{\\beta}=-0.004$, SE $=0.006$, $p=0.51$), and event-study "
                "plots showed no pre-trend divergence and no visible break at the policy date. "
                "Results were stable across several control-group matching specifications.",
        reflections="Mid-size counties in this sample had relatively low minimum-wage "
                    "bindingness (wages were often already near the new floor), which may "
                    "explain the null; larger, more binding increases in high cost-of-living "
                    "areas are a distinct empirical question this design doesn't speak to.",
        literature="Card & Krueger (1994) New Jersey fast-food study; Neumark & Wascher (2008) "
                   "review favoring disemployment effects; Cengiz et al. (2019) bunching-based "
                   "estimator finding minimal employment effects.",
        figures=["Event-study coefficients relative to minimum-wage increase date."],
    ),
    dict(
        id="ling-010",
        title="Bilingual toddlers show no code-switching cost in naming latency versus monolinguals",
        discipline="ling",
        author="F. Adeyemi",
        date="2025-07-25",
        tags=["bilingualism", "code-switching", "naming latency", "language acquisition"],
        data_available=False,
        abstract="We compared picture-naming latency in 30-month-old bilingual toddlers during "
                 "blocked single-language naming versus trials that required switching "
                 "languages between items, against monolingual toddlers naming the same "
                 "pictures in one language. Bilinguals showed no significant switch-cost "
                 "penalty relative to their own single-language baseline ($p=0.29$), and no "
                 "latency difference from monolinguals overall ($p=0.63$).",
        theory="Adult bilingual code-switching studies reliably show a latency cost when "
               "switching languages compared to staying in one language, attributed to the "
               "need to inhibit the non-target language. We expected an analogous, perhaps "
               "larger, cost in toddlers whose inhibitory control is still developing.",
        hypothesis="Bilingual toddlers will name pictures more slowly on switch trials than on "
                   "single-language trials, and more slowly overall than monolingual peers.",
        results="Switch trials were not significantly slower than single-language trials "
                "within bilinguals ($p=0.29$), and overall naming latency did not differ from "
                "monolinguals ($p=0.63$). Both groups showed the expected age-typical latency "
                "decrease across the session, confirming the task was sensitive to general "
                "processing speed changes.",
        reflections="Switch costs in adults may partly reflect strategic, task-set control "
                    "processes that are simply not yet online at 30 months, rather than the "
                    "absence of any language-competition process at all; older toddlers or a "
                    "more demanding switching design might reveal a cost this study could not.",
        literature="Meuter & Allport (1999) adult language-switching costs; Byers-Heinlein & "
                   "Werker (2013) on bilingual toddler language differentiation; Poulin-Dubois "
                   "et al. (2011) on bilingual executive-function advantages debate.",
        figures=["Mean naming latency by trial type and group."],
    ),
]


def encode_body(report):
    body = {
        "abstract": report["abstract"],
        "theory": report["theory"],
        "hypothesis": report["hypothesis"],
        "results": report["results"],
        "reflections": report["reflections"],
        "literature": report["literature"],
        "figures": report["figures"],
    }
    raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
    return base64.b64encode(raw).decode("ascii")


def main():
    entries = []
    for r in REPORTS:
        entry = {
            "id": r["id"],
            "title": r["title"],
            "discipline": r["discipline"],
            "author": r["author"],
            "date": r["date"],
            "tags": r["tags"],
            "dataAvailable": r["data_available"],
            "bodyEncoded": encode_body(r),
        }
        entries.append(entry)

    js = []
    js.append("// GENERATED FILE - do not hand-edit.")
    js.append("// Source of truth: scripts/gen_reports_data.py")
    js.append("// Regenerate with: python3 scripts/gen_reports_data.py")
    js.append("//")
    js.append("// Metadata (id/title/discipline/author/date/tags) is plain, since it is")
    js.append("// catalog information, not prose. Each report's prose sections (abstract,")
    js.append("// theory, hypothesis, results, reflections, literature, figure captions)")
    js.append("// are bundled into one JSON blob and base64-encoded via assets/codec.js so")
    js.append("// this file never contains readable body text. Decoding happens at runtime")
    js.append("// in assets/report.js, right before injecting into the DOM.")
    js.append("window.REP0RT_DATA = " + json.dumps(entries, indent=2, ensure_ascii=False) + ";")

    out_path = "assets/reports-data.js"
    with open(out_path, "w") as f:
        f.write("\n".join(js) + "\n")
    print("wrote", out_path, "with", len(entries), "reports")


if __name__ == "__main__":
    main()
