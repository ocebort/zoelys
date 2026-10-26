import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('/Users/ocebort/all_gig_platforms_reviews.csv')
negative_reviews = df[df['rating'].isin([1, 2])].copy()
total_neg = len(negative_reviews)

keywords = {
    'Financial Trust & Service Billing': ['fee', 'charge', 'refund', 'billing', 'price', 'expensive', 'money', 'cost', 'pay'],
    'Communication & Responsiveness': ['support', 'customer service', 'contact', 'respond', 'unresponsive', 'phone', 'call', 'message', 'reply'],
    'Cancellation & Backup Failure': ['cancel', 'cancelled', 'backup', 'last minute', 'availability', 'reliable', 'no show'],
    'Safety Incident & Pet Stress': ['safety', 'vet', 'emergency', 'bite', 'hurt', 'stress', 'sick', 'danger', 'injury']
}

theme_counts = {}
for theme, words in keywords.items():
    pattern = '|'.join(words)
    matches = negative_reviews['review_text'].str.contains(pattern, case=False, na=False)
    theme_counts[theme] = matches.sum()

theme_df = pd.DataFrame(list(theme_counts.items()), columns=['Theme', 'Count'])
theme_df['Share (%)'] = (theme_df['Count'] / total_neg) * 100
theme_df = theme_df.sort_values(by='Share (%)', ascending=True)

plt.figure(figsize=(10, 5))
bars = plt.barh(theme_df['Theme'], theme_df['Share (%)'], color='firebrick', alpha=0.85)
plt.title('Prevalence of Operational Failure Themes in Negative Reviews', fontsize=12, pad=15)
plt.xlabel('Share of Negative Reviews (%)', fontsize=10)
plt.xlim(0, 50)
for bar in bars:
    width = bar.get_width()
    plt.text(width + 1, bar.get_y() + bar.get_height()/2, f'{width:.1f}%', va='center', fontsize=10, weight='bold')

plt.tight_layout()
plt.savefig('complaint_themes_breakdown.png', dpi=300, bbox_inches='tight')
print("Generated: complaint_themes_breakdown.png")
