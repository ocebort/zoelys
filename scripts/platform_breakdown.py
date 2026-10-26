import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('/Users/ocebort/all_gig_platforms_reviews.csv')
negative_reviews = df[df['rating'].isin([1, 2])].copy()

keywords = {
    'Financial Trust & Service Billing': ['fee', 'charge', 'refund', 'billing', 'price', 'expensive', 'money', 'cost', 'pay'],
    'Communication & Responsiveness': ['support', 'customer service', 'contact', 'respond', 'unresponsive', 'phone', 'call', 'message', 'reply'],
    'Cancellation & Backup Failure': ['cancel', 'cancelled', 'backup', 'last minute', 'availability', 'reliable', 'no show'],
    'Safety Incident & Pet Stress': ['safety', 'vet', 'emergency', 'bite', 'hurt', 'stress', 'sick', 'danger', 'injury']
}

platform_analysis = []
for platform in negative_reviews['target_platform'].unique():
    plat_neg = negative_reviews[negative_reviews['target_platform'] == platform]
    total_plat_neg = len(plat_neg)
    row = {'Platform': platform, 'Total Negative Reviews': total_plat_neg}
    for theme, words in keywords.items():
        pattern = '|'.join(words)
        count = plat_neg['review_text'].str.contains(pattern, case=False, na=False).sum()
        row[theme] = (count / total_plat_neg) * 100 if total_plat_neg > 0 else 0
    platform_analysis.append(row)

platform_df = pd.DataFrame(platform_analysis)
plt.figure(figsize=(10, 6))
themes_list = list(keywords.keys())
color_palette = ['#1f4e78', '#418ab3', '#85c1e9', '#f2f4f4']

platform_df.set_index('Platform')[themes_list].plot(
    kind='barh', stacked=True, figsize=(10, 6), color=color_palette, edgecolor='black', linewidth=0.5
)
plt.title('Distribution of Failure Themes Across Competitor Platforms (%)', fontsize=12, pad=15)
plt.xlabel('Cumulative Percentage of Negative Reviews Mentioning Theme', fontsize=10)
plt.ylabel('')
plt.legend(title='Failure Themes', bbox_to_anchor=(1.05, 1), loc='upper left')
plt.tight_layout()
plt.savefig('platform_theme_breakdown_stacked.png', dpi=300, bbox_inches='tight')
print("Generated: platform_theme_breakdown_stacked.png")
