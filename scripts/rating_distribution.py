import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv('/Users/ocebort/all_gig_platforms_reviews.csv')
sns.set_theme(style="whitegrid")
plt.figure(figsize=(8, 5))
sns.countplot(data=df, x='rating', palette='viridis')
plt.title(f'Competitor Star Rating Distribution (N = {len(df)})', fontsize=12, pad=15)
plt.xlabel('Star Rating (1 to 5)', fontsize=10)
plt.ylabel('Number of Reviews', fontsize=10)
plt.tight_layout()
plt.savefig('rating_distribution.png', dpi=300, bbox_inches='tight')
print("Generated: rating_distribution.png")
