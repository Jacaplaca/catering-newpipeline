'use client';
import React, { useCallback, type FunctionComponent } from "react";
import { type Locale } from '@root/i18n-config';
import { env } from '@root/app/env';
import Dropdown from '@root/app/_components/ui/Inputs/Dropdown';
import { useRouter, useSearchParams } from 'next/navigation';
import PageNumberInput from '@root/app/_components/ui/Pagination/PageNumberInput';
import translate from '@root/app/lib/lang/translate';
import ChevronButton from '@root/app/_components/ui/Pagination/ChevronButton';
import makeHref from '@root/app/lib/url/makeHref';
import getPagination from '@root/app/lib/getPagination';

const Pagination: FunctionComponent<{
  lang: Locale;
  group: string;
  dictionary?: Record<string, string>;
  totalCount: number;
  updatePage?: (page: number) => void;
  updateLimit?: (limit: number) => void;
  page?: number;
  limit?: number;
}> = ({
  lang = env.DEFAULT_LOCALE,
  group,
  totalCount,
  dictionary = {},
  updatePage,
  updateLimit,
  page: externalPage,
  limit: externalLimit,
}) => {
    const router = useRouter();
    const searchParams = useSearchParams()
    const useUrlNavigation = !updatePage && !updateLimit;

    // Use external values if provided, otherwise get from searchParams
    const paginationParams = useUrlNavigation
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();

    if (!useUrlNavigation && externalPage !== undefined) {
      paginationParams.set('page', externalPage.toString());
    }
    if (!useUrlNavigation && externalLimit !== undefined) {
      paginationParams.set('limit', externalLimit.toString());
    }

    const {
      page: currentPage,
      limit: currentLimit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      firstElement,
      lastElement,
    } = getPagination(paginationParams, totalCount);

    const makePaginationUrl = useCallback(
      (name: string, value: string) => {
        if (!useUrlNavigation) return '#';
        const params = new URLSearchParams(searchParams.toString())
        params.set(name, value);
        if (name === 'limit') {
          params.set('page', '1');
        }
        return makeHref({ lang, page: group, slugs: [], params }, true);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [searchParams, useUrlNavigation]
    )

    const onChangeLimit = (value: string) => {
      if (useUrlNavigation) {
        const url = makePaginationUrl("limit", value);
        router.push(url);
      } else {
        updateLimit?.(parseInt(value));
        // When changing limit, reset to page 1
        updatePage?.(1);
      }
    }

    const handleTypePage = (value: number) => {
      if (useUrlNavigation) {
        const url = makePaginationUrl("page", value.toString());
        router.push(url);
      } else {
        updatePage?.(value);
      }
    }

    const handleChangePage = (page: number) => {
      if (useUrlNavigation) {
        const url = makePaginationUrl("page", page.toString());
        router.push(url);
      } else {
        updatePage?.(page);
      }
    }

    const limits = [10, 20, 50, 100].map((value) => ({ label: value.toString(), value: value.toString() }));

    return (
      <>
        {totalPages > 1 && (
          <nav
            className="pagination  flex items-center justify-between py-2 font-sans w-full"
            aria-label="Pagination"
          >
            <div className="flex items-center gap-2" >
              <span>{translate(dictionary, 'shared:per_page')}</span>
              <Dropdown
                onChange={onChangeLimit}
                options={limits}
                value={currentLimit.toString()}
                styles={{
                  control:
                  {
                    width: '70px',
                  }
                }}
              />
              <div className="flex items-center ml-4">
                <span>{translate(dictionary, 'shared:page', [currentPage, totalPages])}</span>
              </div>
              <div className="flex items-center ml-4">
                {/* <span>{translate(dictionary, 'shared:page', [currentPage, totalPages])}</span> */}
                <span>{translate(dictionary, 'shared:showing', [firstElement, lastElement, totalCount])}</span>
                {/* {firstElement} - {lastElement} {totalCount} */}
              </div>
            </div>
            <div className="flex items-center">
              <ChevronButton
                direction='left'
                double
                disabled={!hasPrevPage}
                url={makePaginationUrl("page", "1")}
                onClick={useUrlNavigation ? undefined : () => handleChangePage(1)}
              />
              <ChevronButton
                direction='left'
                disabled={!hasPrevPage}
                url={makePaginationUrl("page", `${currentPage - 1}`)}
                onClick={useUrlNavigation ? undefined : () => handleChangePage(currentPage - 1)}
              />

              <PageNumberInput
                redirect={handleTypePage}
                currentPage={currentPage}
                totalPages={totalPages}
              />

              <ChevronButton
                direction='right'
                disabled={!hasNextPage}
                url={makePaginationUrl("page", `${currentPage + 1}`)}
                onClick={useUrlNavigation ? undefined : () => handleChangePage(currentPage + 1)}
              />
              <ChevronButton
                direction='right'
                double
                disabled={!hasNextPage}
                url={makePaginationUrl("page", totalPages.toString())}
                onClick={useUrlNavigation ? undefined : () => handleChangePage(totalPages)}
              />
            </div>
          </nav>
        )}
      </>
    );
  };

export default Pagination;
