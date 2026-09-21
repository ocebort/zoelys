import streamlit as st
import pandas as pd
import plotly.express as px
import re

# Page Configuration
st.set_page_config(page_title="Zoélys Review Analytics & Market Failure Classifier", layout="wide")

st.title("📊 Zoélys Market Failure Diagnostic Engine")
st.markdown("### Microeconomic Analysis of Peer-to-Peer Pet Care Platform Reviews")

# File Upload or Default File Loading
uploaded_file = st.file_uploader("Upload CSV File containing Scraped Reviews", type=["csv"])

if uploaded_file is None:
    try:
        # Tries parent folder first, then current folder
        df = pd.read_csv('all_gig_platforms_reviews.csv')
    except Exception:
        try:
            df = pd.read_csv('../all_gig_platforms_reviews.csv')
        except Exception:
            df = None
    if df is not None:
        st.info("Loaded default dataset: `all_gig_platforms_reviews.csv`")
else:
    df = pd.read_csv(uploaded_file)

if df is not None:
    # Pre-processing
    df['text_clean'] = (df['title'].fillna('') + " " + df['review_text'].fillna('')).str.lower()

    # Theoretical Taxonomy
    taxonomy = {
        'Adverse Selection (Quality/Vetting Failure)': [
            'vetting', 'background check', 'unqualified', 'inexperienced', 'cancel', 
            'cancellation', 'scam', 'fake', 'unprofessional', 'no show', 'unscreened'
        ],
        'Moral Hazard (Duty Neglect/Shirking)': [
            'hurt', 'injured', 'sick', 'neglect', 'stole', 'stolen', 'damage', 
            'short', 'food', 'medication', 'died', 'lost', 'feces', 'unsupervised', 'shaking'
        ],
        'Rating Inflation & Support Distrust': [
            '5 star', 'star rating', 'review', 'support', 'customer service', 'refund', 
            'dispute', 'guarantee', 'fee', 'charge', 'banned', 'suspended', 'bot', 'automated'
        ]
    }

    # Run Algorithmic Categorization on Negatives (Ratings 1 & 2)
    neg_df = df[df['rating'].isin([1, 2])].copy()

    for category, keywords in taxonomy.items():
        pattern = r'\b(?:' + '|'.join(keywords) + r')\b'
        neg_df[category] = neg_df['text_clean'].str.contains(pattern, regex=True)

    # Sidebar Filters
    st.sidebar.header("Filter Options")
    selected_platform = st.sidebar.multiselect(
        "Select Target Platform(s):",
        options=df['target_platform'].unique(),
        default=df['target_platform'].unique()
    )

    filtered_neg = neg_df[neg_df['target_platform'].isin(selected_platform)]

    # Key Metrics Bar
    col1, col2, col3 = st.columns(3)
    col1.metric("Negative Sample (N)", len(filtered_neg))
    col2.metric("Adverse Selection Rate", f"{filtered_neg['Adverse Selection (Quality/Vetting Failure)'].mean()*100:.1f}%")
    col3.metric("Rating Inflation/Distrust Rate", f"{filtered_neg['Rating Inflation & Support Distrust'].mean()*100:.1f}%")

    # Interactive Visualizations
    st.markdown("---")
    st.subheader("📈 Failure Mode Distribution Across Platforms")

    summary_df = filtered_neg.groupby('target_platform')[list(taxonomy.keys())].mean() * 100
    summary_reset = summary_df.reset_index().melt(id_vars='target_platform', var_name='Failure Mode', value_name='Percentage (%)')

    fig = px.bar(
        summary_reset, 
        x='target_platform', 
        y='Percentage (%)', 
        color='Failure Mode', 
        barmode='group',
        title="Theoretical Breakdown of Negative Reviews by Platform",
        labels={'target_platform': 'Platform', 'Percentage (%)': 'Share of Negative Sample (%)'}
    )
    st.plotly_chart(fig, use_container_width=True)

    # Verbatim Qualitative Exporter
    st.markdown("---")
    st.subheader("🔍 Extract Verbatim Evidence for Thesis Callouts")
    selected_cat = st.selectbox("Select Failure Mode to Inspect:", list(taxonomy.keys()))

    sample_quotes = filtered_neg[filtered_neg[selected_cat]][['target_platform', 'rating', 'title', 'review_text']].head(5)
    
    for idx, row in sample_quotes.iterrows():
        st.info(f"**Platform:** {row['target_platform']} | **Rating:** {row['rating']} Stars\n\n**Title:** {row['title']}\n\n*\"{row['review_text']}\"*")
