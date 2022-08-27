import { compile, run } from "@mdx-js/mdx";
import { GetStaticPaths, GetStaticProps } from "next";
import dynamic from "next/dynamic";
import fsp from "node:fs/promises";
import path from "node:path";
import { Fragment, Suspense, useEffect, useState, lazy } from "react";
import * as runtime from "react/jsx-runtime";

interface Props {
	code: string;
}

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
	const slug = ctx.params?.slug;
	if (typeof slug !== "string") {
		throw new Error(`slug is not a string: ${slug}`);
	}

	const filePath = `./blog/${ctx.params!.slug}.mdx`;
	const mdx = await (async () => {
		try {
			return await fsp.readFile(filePath, { encoding: "utf-8" });
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to read ${filePath}: ${error.message}`);
			}

			throw error;
		}
	})();

	const compiled = await compile(mdx, { outputFormat: "function-body" });
	const code = compiled.toString("utf-8");

	return {
		props: { code },
	};
};

export const getStaticPaths: GetStaticPaths = async () => {
	const slugs = (await fsp.readdir("./blog", { encoding: "utf-8" })).map(
		(fileName) => fileName.replace(".mdx", "")
	);

	return {
		paths: slugs.map((slug) => {
			return {
				params: { slug },
			};
		}),
		fallback: false,
	};
};

export default function Page({ code }: Props) {
	const MyContent = lazy(() => run(code, runtime));

	return (
		<Suspense>
			<MyContent />
		</Suspense>
	);
}
