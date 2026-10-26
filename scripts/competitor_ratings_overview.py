import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

file_path = '/Users/ocebort/all_gig_platforms_reviews.csv'
df = pd.read_csv(file_path)

# Calculate summary stats per platform
platform_stats = df.groupby('target_platform').agg(
    mean_rating=('rating', 'mean'),
    total_reviews=('rating', 'count'),
    pct_positive=('rating', lambda x: (x >= 4).mean() * 100),
    pct_negative=('rating', lambda x: (x <= 2).mean() * 100)
).reset_index()

# Plotting Positive vs Negative Share per Platform
plt.figure(figsize=(10, 5))
sns.set_theme(style="whitegrid")

x = range(len(platform_stats))
width = 0.35

plt.bar([p - width/2 for p in x], platform_stats['pct_positive'], width, label='Positive (4-5 Stars)', color='seagreen', alpha=0.85)
plt.bar([p + width/2 for p in x], platform_stats['pct_negative'], width, label='Negative (1-2 Stars)', color='firebrick', alpha=0.85)

plt.title('Share of Positive vs. Negative Reviews Across Competitor Platforms', fontsize=12, pad=15)
plt.xlabel('Competitor Platform', fontsize=10)
plt.ylabel('Share of Reviews (%)', fontsize=10)
plt.xticks(ticks=x, labels=platform_stats['target_platform'])
plt.legend(title='Sentiment Breakdown')
plt.ylim(0, 100)
plt.tight_layout()

plt.savefig('competitor_sentiment_overview.png', dpi=300, bbox_inches='tight')
print("Generated: competitor_sentiment_overview.png")
