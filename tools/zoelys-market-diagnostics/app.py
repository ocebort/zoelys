import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import re

# ---------------------------------------------------------
# Page Setup & Clean Executive Styling (Light Theme)
# ---------------------------------------------------------
st.set_page_config(
    page_title="Zoélys Market Failure Diagnostic Engine",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Light CSS Theme
st.markdown("""
    <style>
    .stApp {
        background-color: #f8f9fa;
        color: #212529;
    }
    
    /* Executive Metric Header Cards */
    .metric-card {
        background-color: #ffffff;
        border: 1px solid #e9ecef;
        border-top: 4px solid #1e3d59;
        border-radius: 8px;
        padding: 16px 12px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .metric-val {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1e3d59;
    }
    .metric-lbl {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #6c757d;
        font-weight: 600;
        margin-top: 4px;
    }
    .metric-sub {
        font-size: 0.8rem;
        color: #d9534f;
        margin-top: 4px;
        font-weight: 600;
    }

    /* Methodological & Takeaway Callout Boxes */
    .takeaway-box {
        background-color: #ffffff;
        border-left: 4px solid #1e3d59;
        border: 1px solid #e9ecef;
        border-left-width: 4px;
        border-left-color: #1e3d59;
        border-radius: 6px;
        padding: 14px 18px;
        margin-bottom: 20px;
        font-size: 0.92rem;
        color: #333333;
        line-height: 1.5;
    }
    
    /* Academic Analysis Cards under Figures */
    .analysis-box {
        background-color: #f1f3f5;
        border-left: 3px solid #0275d8;
        border-radius: 4px;
        padding: 12px 16px;
        margin-top: 10px;
        margin-bottom: 25px;
        font-size: 0.9rem;
        color: #2b2d42;
        line-height: 1.5;
    }
    
    /* Review Evidence Cards */
    .review-card {
        background-color: #ffffff;
        border: 1px solid #e9ecef;
        border-left: 4px solid #1e3d59;
        border-radius: 8px;
        padding: 18px;
        margin-bottom: 14px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    .badge-plat {
        background-color: #1e3d59;
        color: #ffffff;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .badge-star {
        background-color: #d9534f;
        color: #ffffff;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.72rem;
        font-weight: 700;
    }
    .badge-role {
        background-color: #0275d8;
        color: #ffffff;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.72rem;
        font-weight: 700;
    }
    .keyword-highlight {
        background-color: #ffe082;
        color: #000000;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 3px;
    }
    </style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Plotly Light Academic Theme
# ---------------------------------------------------------
LIGHT_TEMPLATE = go.layout.Template()
LIGHT_TEMPLATE.layout = go.Layout(
    paper_bgcolor='#ffffff',
    plot_bgcolor='#ffffff',
    font=dict(color='#212529', family="sans-serif"),
    xaxis=dict(gridcolor='#f1f3f5', zerolinecolor='#f1f3f5'),
    yaxis=dict(gridcolor='#f1f3f5', zerolinecolor='#f1f3f5')
)

COLOR_PALETTE = ['#1e3d59', '#d9534f', '#0275d8', '#f0ad4e', '#5bc0de', '#5e5ce6']

# ---------------------------------------------------------
# Data Preprocessing Pipeline
# ---------------------------------------------------------
@st.cache_data
def load_and_preprocess():
    try:
        df = pd.read_csv('all_gig_platforms_reviews.csv')
    except Exception:
        try:
            df = pd.read_csv('../all_gig_platforms_reviews.csv')
        except Exception:
            return None

    df['text_clean'] = (df['title'].fillna('') + " " + df['review_text'].fillna('')).str.lower()
    return df

df_raw = load_and_preprocess()

# Empirical Taxonomy Mapping
sub_taxonomy = {
    'Adverse Selection: Inadequate Vetting': ['vetting', 'background check', 'unscreened', 'impostor', 'fake profile', 'criminal', 'screening'],
    'Adverse Selection: Reliability Failure (No-Shows)': ['no show', 'never showed', 'flake', 'stranded', 'cancelled last minute', 'canceled last minute', 'cancelled', 'canceled'],
    'Adverse Selection: Lack of Experience/Competence': ['unqualified', 'inexperienced', 'unprofessional', 'scam', 'liar', 'clueless', 'careless'],
    'Moral Hazard: Pet Health & Safety Harm': ['hurt', 'injured', 'sick', 'died', 'shaking', 'blood', 'hospital', 'vet', 'emergency', 'off-leash', 'bite', 'bitten'],
    'Moral Hazard: Neglect & Abandonment': ['neglect', 'food', 'medication', 'feces', 'pee', 'poop', 'dirty', 'unsupervised', 'alone', 'locked', 'cage', 'crate'],
    'Moral Hazard: Theft & Property Damage': ['stole', 'stolen', 'damage', 'robbed', 'missing money', 'stole my', 'thief', 'trashed'],
    'Moral Hazard: Service Truncation (Short Walks)': ['short walk', 'left early', 'cut short', '10 mins', '15 mins', 'half time', 'gps'],
    'Rating Inflation: Disconnect & Fake Reviews': ['5 star', 'star rating', 'fake review', 'misleading rating', 'reviews lied', 'filtered review'],
    'Institutional Distrust: Automated/Bot Support': ['support', 'customer service', 'bot', 'automated', 'response', 'phone', 'no help', 'useless', 'no response', 'agent'],
    'Institutional Distrust: Account Suspension & Fee Disputes': ['refund', 'dispute', 'guarantee', 'fee', 'charge', 'banned', 'suspended', 'account locked', 'payout']
}

macro_mapping = {
    'Adverse Selection: Inadequate Vetting': 'Adverse Selection',
    'Adverse Selection: Reliability Failure (No-Shows)': 'Adverse Selection',
    'Adverse Selection: Lack of Experience/Competence': 'Adverse Selection',
    'Moral Hazard: Pet Health & Safety Harm': 'Moral Hazard',
    'Moral Hazard: Neglect & Abandonment': 'Moral Hazard',
    'Moral Hazard: Theft & Property Damage': 'Moral Hazard',
    'Moral Hazard: Service Truncation (Short Walks)': 'Moral Hazard',
    'Rating Inflation: Disconnect & Fake Reviews': 'Rating Inflation & Distrust',
    'Institutional Distrust: Automated/Bot Support': 'Rating Inflation & Distrust',
    'Institutional Distrust: Account Suspension & Fee Disputes': 'Rating Inflation & Distrust'
}

# Sidebar Design
st.sidebar.markdown("### Zoélys Control Panel")
st.sidebar.markdown("Dataset Slicing and Parameters")
st.sidebar.markdown("---")

uploaded_file = st.sidebar.file_uploader("Upload CSV Dataset", type=["csv"])
if uploaded_file is not None:
    df = pd.read_csv(uploaded_file)
    df['text_clean'] = (df['title'].fillna('') + " " + df['review_text'].fillna('')).str.lower()
elif df_raw is not None:
    df = df_raw.copy()
else:
    st.error("Please upload the dataset file to proceed.")
    st.stop()

# Classify Taxonomy
for sub_cat, terms in sub_taxonomy.items():
    pattern = r'\b(?:' + '|'.join(terms) + r')\b'
    df[sub_cat] = df['text_clean'].str.contains(pattern, regex=True)

for macro in set(macro_mapping.values()):
    relevant_subs = [k for k, v in macro_mapping.items() if v == macro]
    df[macro] = df[relevant_subs].any(axis=1)

sitter_keywords = ['as a sitter', 'i am a sitter', 'independent agent', 'sitter account', 'my background check', 'payout', 'commission', 'my clients', 'walker']
df['user_role'] = 'Pet Owner'
df.loc[df['text_clean'].str.contains('|'.join(sitter_keywords), regex=True), 'user_role'] = 'Caregiver / Sitter'

# Filters
selected_platforms = st.sidebar.multiselect("Platforms:", sorted(df['target_platform'].dropna().unique()), default=df['target_platform'].dropna().unique())
selected_ratings = st.sidebar.multiselect("Star Ratings:", sorted(df['rating'].dropna().unique()), default=[1, 2])
selected_roles = st.sidebar.multiselect("User Role:", sorted(df['user_role'].unique()), default=df['user_role'].unique())

filtered_df = df[
    (df['target_platform'].isin(selected_platforms)) &
    (df['rating'].isin(selected_ratings)) &
    (df['user_role'].isin(selected_roles))
]

# ---------------------------------------------------------
# Executive Header & Methodological Framing
# ---------------------------------------------------------
st.title("Zoélys Market Failure Diagnostic Engine")
st.markdown("##### Empirical Governance Analysis across Two-Sided Pet Care Platforms")

total_n = len(filtered_df)

st.markdown(f"""
    <div class="takeaway-box">
        <strong>Methodological Note:</strong> Figures represent a 
        <strong>purposive empirical sample of N = {total_n:,} reviews</strong> collected from public review platforms. 
        Percentages indicate internal sample composition rounded to whole numbers.
    </div>
""", unsafe_allow_html=True)

# Executive Metric Grid
adv_count = int(filtered_df['Adverse Selection'].sum()) if total_n > 0 else 0
mh_count = int(filtered_df['Moral Hazard'].sum()) if total_n > 0 else 0
dis_count = int(filtered_df['Rating Inflation & Distrust'].sum()) if total_n > 0 else 0

m1, m2, m3, m4 = st.columns(4)
with m1:
    st.markdown(f'<div class="metric-card"><div class="metric-val">{total_n:,}</div><div class="metric-lbl">Sample Volume (N)</div><div class="metric-sub">Analyzed Reviews</div></div>', unsafe_allow_html=True)
with m2:
    st.markdown(f'<div class="metric-card"><div class="metric-val">{adv_count:,}</div><div class="metric-lbl">Adverse Selection</div><div class="metric-sub">{round((adv_count/total_n)*100) if total_n > 0 else 0}% of sample</div></div>', unsafe_allow_html=True)
with m3:
    st.markdown(f'<div class="metric-card"><div class="metric-val">{mh_count:,}</div><div class="metric-lbl">Moral Hazard</div><div class="metric-sub">{round((mh_count/total_n)*100) if total_n > 0 else 0}% of sample</div></div>', unsafe_allow_html=True)
with m4:
    st.markdown(f'<div class="metric-card"><div class="metric-val">{dis_count:,}</div><div class="metric-lbl">Institutional Distrust</div><div class="metric-sub">{round((dis_count/total_n)*100) if total_n > 0 else 0}% of sample</div></div>', unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

if total_n == 0:
    st.warning("No reviews match your filter combination. Modify parameters in the sidebar.")
    st.stop()

# ---------------------------------------------------------
# Dynamic Dashboard Windows
# ---------------------------------------------------------
t1, t2, t3, t4 = st.tabs([
    "1. Macro Failure Analysis",
    "2. Micro Complaint Ranking",
    "3. Two-Sided Friction",
    "4. Verbatim Evidence Reader"
])

# WINDOW 1: MACRO ANALYSIS
with t1:
    st.subheader("Macroeconomic Market Failure Profiles across Incumbents")
    st.markdown("""
        <div class="takeaway-box">
            <strong>Executive Takeaway:</strong> Figure 1.1 evaluates absolute review volume across platforms. 
            Figure 1.2 isolates internal platform composition to compare pre-contractual vetting issues (Adverse Selection) 
            versus post-contractual service breakdowns (Moral Hazard).
        </div>
    """, unsafe_allow_html=True)

    macro_cols = ['Adverse Selection', 'Moral Hazard', 'Rating Inflation & Distrust']
    
    col_a, col_b = st.columns(2)
    
    with col_a:
        st.markdown("##### Figure 1.1: Absolute Failure Volume per Platform (N)")
        m_counts = filtered_df.groupby('target_platform')[macro_cols].sum().reset_index()
        m_melt_counts = m_counts.melt(id_vars='target_platform', var_name='Failure Mode', value_name='Review Count')

        fig1_1 = px.bar(
            m_melt_counts, x='target_platform', y='Review Count', color='Failure Mode',
            barmode='group', text_auto=True,
            color_discrete_map={'Adverse Selection': '#1e3d59', 'Moral Hazard': '#d9534f', 'Rating Inflation & Distrust': '#f0ad4e'}
        )
        fig1_1.update_layout(template=LIGHT_TEMPLATE, xaxis_title="Platform", yaxis_title="Review Count", legend_title="Failure Type")
        st.plotly_chart(fig1_1, use_container_width=True)

    with col_b:
        st.markdown("##### Figure 1.2: Relative Failure Profile per Platform (%)")
        m_props = filtered_df.groupby('target_platform')[macro_cols].mean().reset_index()
        m_melt_props = m_props.melt(id_vars='target_platform', var_name='Failure Mode', value_name='Proportion')
        m_melt_props['Sample Share (%)'] = (m_melt_props['Proportion'] * 100).round(0).astype(int)

        fig1_2 = px.bar(
            m_melt_props, x='target_platform', y='Sample Share (%)', color='Failure Mode',
            barmode='stack', text_auto=True,
            color_discrete_map={'Adverse Selection': '#1e3d59', 'Moral Hazard': '#d9534f', 'Rating Inflation & Distrust': '#f0ad4e'}
        )
        fig1_2.update_layout(template=LIGHT_TEMPLATE, xaxis_title="Platform", yaxis_title="% of Platform Sample", legend_title="Failure Type")
        st.plotly_chart(fig1_2, use_container_width=True)

# WINDOW 2: MICRO RANKING (STACKED VERTICALLY WITH INDIVIDUAL ANALYSES)
with t2:
    st.subheader("Micro Taxonomy Complaint Frequency & Distribution")
    st.markdown("""
        <div class="takeaway-box">
            <strong>Executive Takeaway:</strong> This section provides a detailed breakdown of specific operational failures. 
            Figure 2.1 ranks the relative frequency of all 10 micro-failure categories, while Figure 2.2 analyzes how individual high-severity failure modes are distributed across platforms.
        </div>
    """, unsafe_allow_html=True)

    sub_cols = list(sub_taxonomy.keys())
    sub_counts = filtered_df[sub_cols].sum().reset_index()
    sub_counts.columns = ['Sub-Category', 'Review Count']
    sub_counts['Share of Sample (%)'] = ((sub_counts['Review Count'] / total_n) * 100).round(0).astype(int)
    sub_counts = sub_counts.sort_values(by='Review Count', ascending=True)

    # FIGURE 2.1: FULL WIDTH
    st.markdown("##### Figure 2.1: 10-Factor Micro Failure Ranking (N)")
    fig2_1 = px.bar(
        sub_counts, x='Review Count', y='Sub-Category', orientation='h',
        text_auto=True, color='Review Count', color_continuous_scale='Reds',
        height=450
    )
    fig2_1.update_layout(template=LIGHT_TEMPLATE, xaxis_title="Number of Flagged Reviews", yaxis_title="")
    st.plotly_chart(fig2_1, use_container_width=True)

    # Dynamic top failure extraction for the analysis block
    top_micro = sub_counts.iloc[-1]['Sub-Category']
    top_micro_cnt = sub_counts.iloc[-1]['Review Count']
    top_micro_pct = sub_counts.iloc[-1]['Share of Sample (%)']

    st.markdown(f"""
        <div class="analysis-box">
            <strong>Analytical Interpretation (Figure 2.1):</strong><br>
            Empirical ranking across the dataset highlights <strong>{top_micro}</strong> as the dominant operational breakdown, 
            accounting for {top_micro_cnt} occurrences ({top_micro_pct}% of the analyzed negative sample). Overall, complaints are heavily skewed 
            towards institutional and governance friction (such as unhelpful automated support and fee disputes), followed closely by direct physical care 
            failures (pet injuries and competence deficits). This demonstrates that structural platform governance, rather than individual sitter misconduct alone, 
            drives a major proportion of user dissatisfaction.
        </div>
    """, unsafe_allow_html=True)

    st.markdown("---")

    # FIGURE 2.2: FULL WIDTH BELOW
    st.markdown("##### Figure 2.2: Selected Complaint Share per Platform")
    
    col_sel_left, col_sel_right = st.columns([2, 1])
    with col_sel_left:
        chosen_micro = st.selectbox("Isolate Specific Micro Issue to Analyze Distribution:", sub_cols)

    micro_by_plat = filtered_df.groupby('target_platform')[chosen_micro].sum().reset_index()
    micro_by_plat.columns = ['Platform', 'Count']
    total_issue_cnt = micro_by_plat['Count'].sum()

    fig2_2 = px.pie(
        micro_by_plat, names='Platform', values='Count', hole=0.4,
        color_discrete_sequence=COLOR_PALETTE,
        height=400
    )
    fig2_2.update_layout(template=LIGHT_TEMPLATE)
    st.plotly_chart(fig2_2, use_container_width=True)

    # Dynamic platform share extraction for analysis block
    if total_issue_cnt > 0:
        top_plat = micro_by_plat.sort_values(by='Count', ascending=False).iloc[0]['Platform']
        top_plat_cnt = micro_by_plat.sort_values(by='Count', ascending=False).iloc[0]['Count']
        top_plat_pct = round((top_plat_cnt / total_issue_cnt) * 100) if total_issue_cnt > 0 else 0
        analysis_p2 = f"For <strong>{chosen_micro}</strong> (total N = {total_issue_cnt}), <strong>{top_plat}</strong> represents the highest proportion of complaints at {top_plat_pct}% ({top_plat_cnt} reviews). This indicates localized governance vulnerabilities and highlights where verification or oversight protocols require platform-specific intervention."
    else:
        analysis_p2 = f"No reviews in the currently filtered sample were flagged for <strong>{chosen_micro}</strong>."

    st.markdown(f"""
        <div class="analysis-box">
            <strong>Analytical Interpretation (Figure 2.2):</strong><br>
            {analysis_p2}
        </div>
    """, unsafe_allow_html=True)

# WINDOW 3: TWO-SIDED FRICTION
with t3:
    st.subheader("Two-Sided Market Analysis: Demand vs. Supply Side Friction")
    st.markdown("""
        <div class="takeaway-box">
            <strong>Executive Takeaway:</strong> Figure 3.1 contrasts raw complaint volume between Pet Owners (Demand Side) 
            and Caregivers/Sitters (Supply Side). Figure 3.2 shows the proportional split per platform.
        </div>
    """, unsafe_allow_html=True)

    role_df = filtered_df.groupby(['target_platform', 'user_role']).size().reset_index(name='Review Count')

    col_e, col_f = st.columns(2)

    with col_e:
        st.markdown("##### Figure 3.1: Comparative Review Volume by User Role (N)")
        fig3_1 = px.bar(
            role_df, x='target_platform', y='Review Count', color='user_role',
            barmode='group', text_auto=True,
            color_discrete_map={'Pet Owner': '#1e3d59', 'Caregiver / Sitter': '#0275d8'}
        )
        fig3_1.update_layout(template=LIGHT_TEMPLATE, xaxis_title="Platform", yaxis_title="Review Count", legend_title="Role")
        st.plotly_chart(fig3_1, use_container_width=True)

    with col_f:
        st.markdown("##### Figure 3.2: Marketplace Side Share per Platform (%)")
        role_prop = filtered_df.groupby('target_platform')['user_role'].value_counts(normalize=True).unstack().fillna(0) * 100
        role_prop_df = role_prop.round(0).reset_index().melt(id_vars='target_platform', var_name='user_role', value_name='Share (%)')
        
        fig3_2 = px.bar(
            role_prop_df, x='target_platform', y='Share (%)', color='user_role',
            barmode='stack', text_auto=True,
            color_discrete_map={'Pet Owner': '#1e3d59', 'Caregiver / Sitter': '#0275d8'}
        )
        fig3_2.update_layout(template=LIGHT_TEMPLATE, xaxis_title="Platform", yaxis_title="% Share of Platform Reviews", legend_title="Role")
        st.plotly_chart(fig3_2, use_container_width=True)

# WINDOW 4: VERBATIM READER & HIGHLIGHTER
with t4:
    st.subheader("Verbatim Evidence Reader & Keyword Marker")
    st.markdown("""
        <div class="takeaway-box">
            <strong>Qualitative Evidence:</strong> Select a micro category to review verbatim feedback. 
            Keywords matching the taxonomy are automatically highlighted in <span class="keyword-highlight">yellow</span>.
        </div>
    """, unsafe_allow_html=True)

    col_cat, col_num = st.columns([3, 1])
    with col_cat:
        selected_sub_cat = st.selectbox("Select Micro Category to Audit:", ["All Filtered Reviews"] + list(sub_taxonomy.keys()))
    with col_num:
        max_display = st.number_input("Cards to Display:", min_value=1, max_value=50, value=8)

    if selected_sub_cat != "All Filtered Reviews":
        review_subset = filtered_df[filtered_df[selected_sub_cat] == True]
        matched_terms = sub_taxonomy[selected_sub_cat]
    else:
        review_subset = filtered_df.copy()
        matched_terms = [t for sub in sub_taxonomy.values() for t in sub]

    st.write(f"Displaying **{min(len(review_subset), max_display)}** of **{len(review_subset)}** matching quotes:")

    def highlight_keywords(text, terms):
        if not isinstance(text, str): return ""
        pattern = r'\b(' + '|'.join(re.escape(term) for term in set(terms)) + r')\b'
        return re.sub(pattern, r'<span class="keyword-highlight">\1</span>', text, flags=re.IGNORECASE)

    for idx, row in review_subset.head(max_display).iterrows():
        h_title = highlight_keywords(str(row.get('title', '')), matched_terms)
        h_text = highlight_keywords(str(row.get('review_text', '')), matched_terms)

        st.markdown(f"""
            <div class="review-card">
                <div style="margin-bottom: 8px;">
                    <span class="badge-plat">{str(row.get('target_platform','')).upper()}</span>
                    <span class="badge-star">{str(row.get('rating',''))} ★</span>
                    <span class="badge-role">{str(row.get('user_role',''))}</span>
                </div>
                <div style="font-weight: bold; font-size: 1.05rem; margin-bottom: 6px; color: #1e3d59;">
                    {h_title}
                </div>
                <div style="font-size: 0.92rem; line-height: 1.6; color: #333333;">
                    "{h_text}"
                </div>
            </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.download_button(
        label="Export Filtered Subset for Thesis Appendix (CSV)",
        data=filtered_df.to_csv(index=False).encode('utf-8'),
        file_name='zoelys_filtered_reviews_appendix.csv',
        mime='text/csv'
    )
