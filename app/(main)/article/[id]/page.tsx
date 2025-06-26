export default function ArticlePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Article {params.id}</h1>
      {/* Article content will go here */}
    </div>
  );
}