import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

file_path = '/Users/ocebort/all_gig_platforms_reviews.csv'
df = pd.read_csv(file_path)

# Calculate sample composition
sample_profile = df['target_platform'].value_counts().reset_index()
sample_profile.columns = ['Platform', 'Sample Count (N)']
sample_profile['Share (%)'] = (sample_profile['Sample Count (N)'] / len(df)) * 100
sample_profile = sample_profile.sort_values(by='Sample Count (N)', ascending=True)

plt.figure(figsize=(9, 4.5))
sns.set_theme(style="whitegrid")
bars = plt.barh(sample_profile['Platform'], sample_profile['Sample Count (N)'], color='#1f4e78', alpha=0.85)

plt.title('Review Sample Composition Across Competitor Platforms (Total N = 1,947)', fontsize=12, pad=15)
plt.xlabel('Number of Reviews Sampled (N)', fontsize=10)
plt.ylabel('Competitor Platform', fontsize=10)
plt.xlim(0, 700)

for bar in bars:
    width = bar.get_width()
    plt.text(width + 15, bar.get_y() + bar.get_height()/2, f'N = {int(width)} ({width/1947*100:.1f}%)', 
             va='center', fontsize=10, weight='bold')

plt.tight_layout()
plt.savefig('sample_composition_overview.png', dpi=300, bbox_inches='tight')
print("Generated: sample_composition_overview.png")
