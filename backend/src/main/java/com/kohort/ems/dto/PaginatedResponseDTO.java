package com.kohort.ems.dto;

import java.util.List;

public class PaginatedResponseDTO<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private boolean hasNext;
    private boolean hasPrevious;

    public PaginatedResponseDTO() {
    }

    public PaginatedResponseDTO(List<T> content, int pageNumber, int pageSize, long totalElements,
                                int totalPages, boolean first, boolean last, boolean hasNext, boolean hasPrevious) {
        this.content = content;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.first = first;
        this.last = last;
        this.hasNext = hasNext;
        this.hasPrevious = hasPrevious;
    }

    public static <T> Builder<T> builder() {
        return new Builder<>();
    }

    public static class Builder<T> {
        private List<T> content;
        private int pageNumber;
        private int pageSize;
        private long totalElements;
        private int totalPages;
        private boolean first;
        private boolean last;
        private boolean hasNext;
        private boolean hasPrevious;

        public Builder<T> content(List<T> content) { this.content = content; return this; }
        public Builder<T> pageNumber(int pageNumber) { this.pageNumber = pageNumber; return this; }
        public Builder<T> pageSize(int pageSize) { this.pageSize = pageSize; return this; }
        public Builder<T> totalElements(long totalElements) { this.totalElements = totalElements; return this; }
        public Builder<T> totalPages(int totalPages) { this.totalPages = totalPages; return this; }
        public Builder<T> first(boolean first) { this.first = first; return this; }
        public Builder<T> last(boolean last) { this.last = last; return this; }
        public Builder<T> hasNext(boolean hasNext) { this.hasNext = hasNext; return this; }
        public Builder<T> hasPrevious(boolean hasPrevious) { this.hasPrevious = hasPrevious; return this; }

        public PaginatedResponseDTO<T> build() {
            return new PaginatedResponseDTO<>(content, pageNumber, pageSize, totalElements, totalPages, first, last, hasNext, hasPrevious);
        }
    }

    public List<T> getContent() { return content; }
    public void setContent(List<T> content) { this.content = content; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }

    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public boolean isFirst() { return first; }
    public void setFirst(boolean first) { this.first = first; }

    public boolean isLast() { return last; }
    public void setLast(boolean last) { this.last = last; }

    public boolean isHasNext() { return hasNext; }
    public void setHasNext(boolean hasNext) { this.hasNext = hasNext; }

    public boolean isHasPrevious() { return hasPrevious; }
    public void setHasPrevious(boolean hasPrevious) { this.hasPrevious = hasPrevious; }
}
