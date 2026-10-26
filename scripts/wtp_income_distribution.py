import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

survey_file_path = '/Users/ocebort/Downloads/Zoelys Premium Pet Care & Trust Survey (réponses)-2.xlsx'
df_survey = pd.read_excel(survey_file_path)

income_col = [c for c in df_survey.columns if 'revenu' in c.lower() or 'income' in c.lower()]
wtp_col = [c for c in df_survey.columns if 'prêt' in c.lower() or 'pay' in c.lower() or 'rate' in c.lower()]

if income_col and wtp_col:
    inc_c = income_col[0]
    wtp_c = wtp_col[0]
    df_clean = df_survey[[inc_c, wtp_c]].dropna().copy()
    ct_pct = pd.crosstab(df_clean[inc_c], df_clean[wtp_c], normalize='index') * 100

    plt.figure(figsize=(12, 6))
    sns.set_theme(style="whitegrid")
    ct_pct.plot(kind='bar', stacked=True, figsize=(12, 6), colormap='Blues', edgecolor='black', linewidth=0.5)

    plt.title('Willingness-to-Pay Tier Distribution Across Income Brackets (N = 47)', fontsize=12, pad=15)
    plt.xlabel('Annual Household Income Bracket', fontsize=10)
    plt.ylabel('Percentage of Respondents (%)', fontsize=10)
    plt.legend(title='Willingness-to-Pay Tiers', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.xticks(rotation=15, ha='right')
    plt.tight_layout()
    plt.savefig('wtp_categorical_distribution.png', dpi=300, bbox_inches='tight')
    print("Generated: wtp_categorical_distribution.png")
