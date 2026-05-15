from unstructured.partition.pdf import partition_pdf
from unstructured.chunking.title import chunk_by_title


def parse_pdf(path):
    elements = partition_pdf(
        filename=path,
        strategy="hi_res",
        infer_table_structure=True
    )

    chunks = chunk_by_title(
        elements,
        max_characters=3000,
        new_after_n_chars=2400,
        combine_text_under_n_chars=500
    )

    return chunks