# Zoélys Market Failure Diagnostic Engine

Streamlit dashboards for the thesis (Subtopic A — The Premium Void). These were recovered from a GitHub repo reset and preserved here so they live alongside the platform.

## Files

- `app.py` — executive "Market Failure Diagnostic Engine": pricing dispersion, review variance, premium supply density diagnostics.
- `dashboard.py` — review analytics & market-failure classifier, reads `all_gig_platforms_reviews.csv` (scraped reviews) or an uploaded CSV.
- `requirements.txt` — `streamlit`, `pandas`, `plotly`.

## Run

```bash
pip install -r requirements.txt
streamlit run app.py
```

Feed it the scraped Miami provider reviews CSV (see thesis plan §T2, data-sources table).