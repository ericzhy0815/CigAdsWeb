import adExampleImage from "../assets/ad_exp.png";
import codebookPdf from "../assets/Codebook - Youth_Module_forAIstudy.pdf";
import comparisonPlotImage from "../assets/comparison_plot.png";
import expLabelDistImage from "../assets/exp_label_dist.png";

const resultCards = [
  { title: "Total Datasets", value: "2" },
  { title: "Images Labeled", value: "220" },
  { title: "Average Agreement", value: "91%" },
];

export function InfoPage() {
  return (
    <section className="page">
      <div className="cards-grid">
        {resultCards.map((card) => (
          <article key={card.title} className="placeholder-card">
            <p className="label">{card.title}</p>
            <p className="value">{card.value}</p>
          </article>
        ))}
      </div>

      <article className="research-overview">
        <h3>Research Context</h3>
        <p>
          This project supports a decade-long research effort studying how
          tobacco-related visual advertising (images and video) can influence
          youth attitudes, intentions, and decisions. In the current phase,
          trained labelers apply binary coding criteria to each ad so we can
          build objective, analyzable signals for later modeling and outcome
          analysis. These codes include concrete content attributes such as ad
          themes, whether cartoon elements are present, and other standardized
          indicators defined by the research protocol.
        </p>
        <p>
          <a
            href={codebookPdf}
            target="_blank"
            rel="noreferrer"
            className="inline-link"
          >
            Open the Youth Module codebook (PDF)
          </a>{" "}
          to review the full coding criteria and definitions.
        </p>
        <figure className="example-ad-figure">
          <img
            src={adExampleImage}
            alt="Example cigarette advertisement used for coding practice"
            className="example-ad-image"
          />
          <figcaption>
            Example ad used as a reference for applying binary coding criteria.
          </figcaption>
        </figure>
      </article>

      <article className="research-overview">
        <h3>Results Snapshot</h3>
        <p>
          The label distribution plot shows strong class imbalance across many
          codes, with substantially more negative samples than positive ones.
          This is an important modeling constraint and helps explain why we
          monitor F1 by code instead of relying on accuracy alone.
        </p>
        <figure className="result-figure">
          <img
            src={expLabelDistImage}
            alt="Label distribution by code showing class imbalance"
            className="result-image"
          />
          <figcaption>
            Label prevalence per code in the dataset; most labels are
            predominantly negative.
          </figcaption>
        </figure>

        <p>
          The model comparison plot summarizes per-code F1 across three model
          families (VLM, ResNet, and CLIP). Performance varies meaningfully by
          metric, which highlights that model selection may need to be
          code-specific depending on research priorities.
        </p>
        <figure className="result-figure">
          <img
            src={comparisonPlotImage}
            alt="Per-code F1 comparison across VLM, ResNet, and CLIP pipelines"
            className="result-image"
          />
          <figcaption>
            Per-code F1 scores comparing VLM, ResNet, and CLIP pipelines.
          </figcaption>
        </figure>
      </article>
    </section>
  );
}
