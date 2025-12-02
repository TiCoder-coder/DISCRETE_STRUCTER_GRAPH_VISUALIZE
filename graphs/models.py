from django.db import models

# ---------------------------------------------------- Lưu thông tin chung về đồ thị ----------------------------------------------------
class Graph(models.Model):
    name = models.CharField(max_length=100)
    directed = models.BooleanField(default=False)
    data = models.JSONField()   # chứa danh sách nodes, edges, weights...

    def __str__(self):
        return self.name


# ---------------------------------------------------------- Lưu kết quả thuật toán ------------------------------------------------------
class AlgorithmResult(models.Model):
    graph = models.ForeignKey(Graph, on_delete=models.CASCADE, related_name='results')
    algorithm = models.CharField(max_length=50)
    parameters = models.JSONField(blank=True, null=True)
    result_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.algorithm} on {self.graph.name}"