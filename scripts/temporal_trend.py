import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv('/Users/ocebort/all_gig_platforms_reviews.csv')
df['date_clean'] = pd.to_datetime(df['date'], errors='coerce', utc=True).dt.tz_localize(None)
df['year'] = df['date_clean'].dt.year
temporal_trend = df.groupby('year')['rating'].mean().reset_index()
temporal_trend.columns = ['year', 'avg_rating']
temporal_trend = temporal_trend[temporal_trend['year'].between(2018, 2026)]

plt.figure(figsize=(10, 5))
sns.lineplot(data=temporal_trend, x='year', y='avg_rating', marker='o', color='firebrick', linewidth=2.5, markersize=8)
for _, row in temporal_trend.iterrows():
    plt.text(row['year'], row['avg_rating'] + 0.08, f"{row['avg_rating']:.2f}", ha='center', fontsize=9, weight='bold')

plt.title('Longitudinal Evolution of Competitor Ratings (2018-2026)', fontsize=12, pad=15)
plt.xlabel('Year', fontsize=10)
plt.ylabel('Average Rating (1-5 Stars)', fontsize=10)
plt.ylim(1.0, 5.0)
plt.tight_layout()
plt.savefig('rating_temporal_trend_clean.png', dpi=300, bbox_inches='tight')
print("Generated: rating_temporal_trend_clean.png")
